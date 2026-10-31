import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/models/user_model.dart';
import 'package:projeto_pratico/services/auth_service.dart';
import 'package:projeto_pratico/services/basededados.dart';
import 'package:projeto_pratico/services/sync_manager.dart' show SyncManager;
import 'package:projeto_pratico/services/auth_storage.dart';
import 'package:projeto_pratico/services/firebase_messaging_service.dart';
import 'package:projeto_pratico/riverpood/notification_notifier.dart';

// Controla se utilizador está logado ou deslogado
// AutoLogin, SignIn, SignOut, Change Password, Update Pref Area
// Suporta fluxos intermédios: EMAIL_VERIFICATION_REQUIRED, RECOVERY_*

class AuthState {
  final UserModel? user;
  final bool isLoading;
  final bool rememberMe;
  // Ações intermédias do login
  final String? blockedAction;
  final Map<String, dynamic>? actionData;
  final String? sessionExpiredMessage;

  AuthState({
    this.user,
    this.isLoading = false,
    this.rememberMe = false,
    this.blockedAction,
    this.actionData,
    this.sessionExpiredMessage,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    bool? rememberMe,
    String? blockedAction,
    Map<String, dynamic>? actionData,
    String? sessionExpiredMessage,
    bool clearSessionExpiredMessage = false,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      rememberMe: rememberMe ?? this.rememberMe,
      blockedAction: blockedAction ?? this.blockedAction,
      actionData: actionData ?? this.actionData,
      sessionExpiredMessage: clearSessionExpiredMessage
          ? null
          : (sessionExpiredMessage ?? this.sessionExpiredMessage),
    );
  }

  // Helper: estado tem ação bloqueante?
  bool get hasBlockedAction =>
      blockedAction != null && blockedAction!.isNotEmpty;

  // Criar estado limpo sem ação bloqueante
  AuthState clearAction() {
    return AuthState(
      user: user,
      isLoading: isLoading,
      rememberMe: rememberMe,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService = AuthService();
  final Basededados _db = Basededados();

  final Ref ref; //Aceder a outrs providers

  //O construtor dispara o tryAutoLogin logo que a app arranca!
  AuthNotifier(this.ref) : super(AuthState()) {
    tryAutoLogin();
  }

  UserModel? get currentUser => state.user;
  bool get isAuthenticated => state.user != null;

  void clearSessionExpiredMessage() {
    if (state.sessionExpiredMessage != null) {
      state = state.copyWith(clearSessionExpiredMessage: true);
    }
  }

  Future<bool> tryAutoLogin() async {
    try {
      final localUserMap = await _db.getUser();
      if (localUserMap != null) {
        final userModel = UserModel.fromJson(localUserMap);

        await AuthStorage.saveToken(userModel.token);

        // Tenta renovar o token para garantir que a sessão continua válida e obter nova validade de 7 dias
        try {
          final refreshedToken = await _authService.refreshToken();
          if (refreshedToken != null) {
            final updatedUser = userModel.copyWith(token: refreshedToken);
            await _db.saveUser(updatedUser.toMap());
            await AuthStorage.saveToken(refreshedToken);
            state = AuthState(user: updatedUser, isLoading: false, rememberMe: true);
          } else {
            // Se o refresh retornar null (ex: sem ligação de rede no momento), mantemos o userModel para suporte offline
            state = AuthState(user: userModel, isLoading: false, rememberMe: true);
          }
        } on AuthExpiredException {
          debugPrint("--- [AuthNotifier] Sessão expirada no auto-login (401/403). Limpando dados locais ---");
          await _db.deleteUser();
          await AuthStorage.clearToken();
          state = AuthState(
            user: null,
            isLoading: false,
            rememberMe: false,
            sessionExpiredMessage: 'A sua sessão expirou. Por favor inicie sessão novamente.',
          );
          return false;
        }

        // Subscrever aos tópicos FCM de notificações (global, consultor, utilizador)
        FirebaseMessagingService.subscribeToConsultorTopics(state.user!.id);

        // Sincronização em background ao fazer auto-login
        _triggerSync();
        return true;
      }
    } catch (e) {
      debugPrint("Erro no auto-login: $e");
    }
    return false;
  }

  Future<bool> signIn(String email, String password, bool rememberMe) async {
    state = state.copyWith(isLoading: true, rememberMe: rememberMe);

    try {
      // Usa o loginRaw para capturar ações intermédias
      final jsonResponse = await _authService.loginRaw(email, password);

      if (jsonResponse['success'] != true) {
        state = state.copyWith(isLoading: false);
        throw Exception(
            jsonResponse['message'] ?? 'Credenciais inválidas.');
      }

      final data = jsonResponse['data'];

      // ─── FLUXOS INTERMÉDIOS ────────────────────────────────────────────
      if (data['action'] != null) {
        debugPrint(
            "--- [AuthNotifier] Ação intermédia recebida: ${data['action']} ---");
        state = AuthState(
          isLoading: false,
          rememberMe: rememberMe,
          blockedAction: data['action'],
          actionData: data,
        );
        // Retorna false porque o login não está completo
        return false;
      }

      // ─── LOGIN COMPLETO ────────────────────────────────────────────────
      final userModel = UserModel.fromJson(data);

      debugPrint("--- [Raio-X] Resposta do Login: O token existe? ---");
      debugPrint(
          "--- [Raio-X] TOKEN: '${userModel.token.substring(0, 20)}...' ---");

      await AuthStorage.saveToken(userModel.token);

      // Grava no SQLite local usando chaves compatíveis com o factory
      // Só grava no SQLite se o utilizador pediu para ser lembrado!
      if (rememberMe) {
        await _db.saveUser(userModel.toMap());
      } else {
        // Limpa os dados locais se desmarcar "Lembrar-me"
        await _db.deleteUser();
      }

      //Sincronização inicial - Assim que temos o utilizador e o token, forçamos a primeira sync
      debugPrint('--- [AuthNotifier] Login com sucesso, iniciando Sync ---');
      await _triggerSync();

      state = AuthState(
          user: userModel, isLoading: false, rememberMe: rememberMe);

      // Subscrever aos tópicos FCM de notificações (global, consultor, utilizador)
      FirebaseMessagingService.subscribeToConsultorTopics(userModel.id);

      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false);
      rethrow;
    }
  }

  // MÉTODO AUXILIAR PARA SINCRONIZAÇÃO
  Future<void> _triggerSync() async {
    try {
      debugPrint('--- [AuthNotifier] Iniciando Sync ---');
      final syncManager = SyncManager(ref); // Passamos o ref aqui
      await syncManager.performFullSync();
      ref.read(notificationProvider.notifier).fetchNotifications();
    } catch (e) {
      debugPrint('--- [AuthNotifier] Erro na Sync automática: $e ---');
    }
  }

  // Ligar a alteração de password à UI
  // CORRIGIDO: Agora alinhado com o endpoint /auth/change-default-password do backend
  Future<bool> changePassword(
      String currentPassword, String newPassword, {String? email}) async {
    
    final userEmail = email ?? state.user?.email;
    if (userEmail == null || userEmail.isEmpty) {
      debugPrint("Erro: Email do utilizador não encontrado no estado nem nos argumentos.");
      return false;
    }

    state = state.copyWith(isLoading: true);

    try {
      // 1. O serviço agora devolve o novo token (ou null se falhar)
      final newToken = await _authService.changePassword(
        userEmail, 
        currentPassword, 
        newPassword
      );

      if (newToken != null) {
        // Se estiver num estado intermédio (ex: RECOVERY_TEMP_EXPIRED), o state.user é nulo.
        // Nesse caso, o fluxo apenas valida a troca e retorna sucesso para a UI obrigar a um novo login.
        if (state.user == null) {
          state = state.copyWith(isLoading: false);
          return true; 
        }

        // Caso contrário, atualizamos o estado completo (ex: mudar password no Perfil)
        // 2. Atualizamos o token de forma persistente no dispositivo
        await AuthStorage.saveToken(newToken);

        // 3. Atualizamos o modelo do utilizador com o novo token
        final updatedUser = state.user!.copyWith(
          passwordDefault: false,
          token: newToken,
        );

        // 4. Propagamos o novo estado na árvore do Riverpod para a UI reagir
        state = AuthState(
          user: updatedUser, 
          isLoading: false, 
          rememberMe: state.rememberMe
        );

        // 5. Atualizamos a base de dados local (SQLite) se o rememberMe estiver ativo
        if (state.rememberMe) {
          await _db.saveUser(updatedUser.toMap());
        }
        
        return true;
      } else {
        state = state.copyWith(isLoading: false);
        return false;
      }
    } catch (e) {
      state = state.copyWith(isLoading: false);
      debugPrint("Erro ao mudar password: $e");
      rethrow;
    }
  }

  /// Atualiza as informações de perfil (Nome e Email), sincronizando com o backend,
  /// persistindo localmente na base de dados SQLite e atualizando o estado reativo.
  Future<bool> updateProfile(String novoNome, String novoSobrenome, String novoEmail) async {
    if (state.user == null) return false;

    // 1. Ativa o estado de carregamento na UI[cite: 10]
    state = state.copyWith(isLoading: true);

    try {
      // 2. Efetua o pedido HTTP de atualização ao backend utilizando o token atual[cite: 7, 10]
      final success = await _authService.updateProfileOnServer(
        state.user!.token,
        novoNome,
        novoSobrenome,
        novoEmail,
      );

      // Se o backend rejeitar ou houver falha de rede, paramos e removemos o loading
      if (!success) {
        state = state.copyWith(isLoading: false);
        return false;
      }

      // 3. Cria o objeto do utilizador atualizado com os novos dados validados pelo servidor
      final updatedUser = state.user!.copyWith(
        nome: novoNome,
        apelido: novoSobrenome,
        email: novoEmail,
      );

      // 4. Atualiza a memória e o estado global reativo do Riverpod[cite: 10]
      state = AuthState(
        user: updatedUser,
        isLoading: false,
        rememberMe: state.rememberMe,
        blockedAction: state.blockedAction,
        actionData: state.actionData,
      );

      // 5. Grava os novos dados na base de dados local (SQLite) se o rememberMe estiver ativo[cite: 9]
      if (state.rememberMe) {
        await _db.saveUser(updatedUser.toMap());
      }

      debugPrint("--- [AuthNotifier] Perfil atualizado e sincronizado com o backend com sucesso ---");
      return true;
    
    } catch (e) {
      // Em caso de exceção, desativa o loading e regista o erro[cite: 2]
      state = state.copyWith(isLoading: false);
      debugPrint("Erro ao atualizar o perfil: $e");
      return false;
    }
  }

  // Aceitar consentimento RGPD
  Future<bool> acceptRGPD() async {
    if (state.user == null) return false;

    state = state.copyWith(isLoading: true);

    try {
      final success = await _authService.updateRgpdConsent(
        state.user!.token,
        true,
      );

      if (!success) {
        state = state.copyWith(isLoading: false);
        return false;
      }

      final updatedUser = state.user!.copyWith(rgpdConsent: true);

      state = AuthState(
        user: updatedUser,
        isLoading: false,
        rememberMe: state.rememberMe,
        blockedAction: state.blockedAction,
        actionData: state.actionData,
      );

      if (state.rememberMe) {
        await _db.saveUser(updatedUser.toMap());
      }

      debugPrint("--- [AuthNotifier] RGPD aceite com sucesso ---");
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false);
      debugPrint("Erro ao aceitar RGPD: $e");
      return false;
    }
  }

  // Obter texto da Política RGPD
  Future<String?> fetchPoliticaRGPD() async {
    if (state.user == null) return null;
    return await _authService.getPoliticaRGPD(state.user!.token);
  }

  // Obter texto da Política RGPD de Candidatura
  Future<String?> fetchPoliticaRGPDCandidatura() async {
    if (state.user == null) return null;
    return await _authService.getPoliticaRGPDCandidatura(state.user!.token);
  }

  //Atualizar a Área do utilizador
  Future<void> updateSelectedArea(String areaName, int areaId) async {
    if (state.user == null) return;

    final updatedUser = state.user!.copyWith(area: areaName, idArea: areaId);
    state = AuthState(
        user: updatedUser, isLoading: false, rememberMe: state.rememberMe);

    if (state.rememberMe) {
      await _db.saveUser(updatedUser.toMap());
    }
  }

  // Limpar ação bloqueante (para voltar ao login)
  void clearBlockedAction() {
    state = state.clearAction();
  }

  Future<void> signOut() async {
    // 0. Cancelar subscrições dos tópicos FCM
    if (state.user != null) {
      FirebaseMessagingService.unsubscribeFromConsultorTopics(state.user!.id);
    }

    // 1. Revogar token no backend
    try {
      await _authService.logout();
    } catch (e) {
      debugPrint("Erro ao revogar token no servidor: $e");
    }

    // 2. Limpar dados locais (mesmo que a revogação falhe)
    await _db.deleteUser();
    await AuthStorage.clearToken();
    ref.read(notificationProvider.notifier).reset();

    state = AuthState(user: null, isLoading: false, rememberMe: false);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});
