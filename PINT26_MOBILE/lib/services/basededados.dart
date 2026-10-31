import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:projeto_pratico/models/badge_model.dart';

// Cria tabelas
// Funções de manipular dados + leituras

class Basededados {
  static final Basededados _instance = Basededados._internal();
  static Database? _database;

  factory Basededados() {
    return _instance;
  }

  Basededados._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    // Obtém o caminho do diretório de bases de dados do dispositivo
    String path = join(await getDatabasesPath(), 'bdpdm.db'); //[cite: 4]

    return await openDatabase(
      path,
      version:
          6, // Incrementada para garantir drop limpo de todas as tabelas e reconstrução
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  // Executado APENAS em novas instalações da aplicação
  Future<void> _onCreate(Database db, int version) async {
    await _criarTabelas(db);
  }

  // Executado se a versão da base de dados for incrementada
  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Como estamos a reestruturar, apagamos as tabelas antigas para evitar conflitos
    await db.execute('DROP TABLE IF EXISTS produtos');
    await db.execute('DROP TABLE IF EXISTS users');
    await db.execute('DROP TABLE IF EXISTS sync_queue');
    await db.execute('DROP TABLE IF EXISTS badges');
    await db.execute('DROP TABLE IF EXISTS evidence_queue');
    await db.execute('DROP TABLE IF EXISTS evidencias');

    // Volta a criar com a estrutura correta
    await _criarTabelas(db);
  }

  // Função dedicada à construção do nosso esquema relacional mobile
  Future<void> _criarTabelas(Database db) async {
    // 1. Tabela do Perfil do Consultor (Autenticação)
    await db.execute('''
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        apelido TEXT,
        email TEXT NOT NULL,
        avatar TEXT,
        idioma TEXT,
        thema INTEGER,
        perfis TEXT,
        id_area TEXT,
        area TEXT,
        token TEXT NOT NULL,
        isFirstLogin INTEGER NOT NULL,
        rgpdConsent INTEGER NOT NULL,
        pontos INTEGER NOT NULL,
        saudacao TEXT,
        data_registo TEXT
      )
    ''');

    // 2. Tabela do Catálogo de Badges (Sincronizado da API)
    await db.execute('''
      CREATE TABLE badges (
        id_badge TEXT PRIMARY KEY,
        titulo TEXT,
        descricao TEXT,
        pontos INTEGER
      )
    ''');

    // 3. Fila de Evidências (Para uploads Offline -> Online)
    await db.execute('''
      CREATE TABLE evidence_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        body TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    ''');

    // 4. Tabela de Evidências sincronizadas do servidor (usada pelo SyncManager)
    await db.execute('''
      CREATE TABLE evidencias (
        id_evidencia TEXT PRIMARY KEY,
        requisito_codigo TEXT,
        descricao TEXT
      )
    ''');
  }

  // ==========================================
  // MÉTODOS GENÉRICOS DE SQL (Necessários para o SyncManager)
  // ==========================================

  // Permite executar INSERTs dinâmicos criados por outras classes
  Future<int> rawInsert(String sql, [List<Object?>? arguments]) async {
    //[cite: 4]
    final db = await database;
    return await db.rawInsert(sql, arguments); //[cite: 4]
  }

  // Permite executar SELECTs dinâmicos criados por outras classes
  Future<List<Map<String, dynamic>>> query(String sql,
      [List<Object?>? arguments]) async {
    final db = await database;
    return await db.rawQuery(sql, arguments);
  }

  // Permite executar UPDATEs dinâmicos
  Future<int> rawUpdate(String sql, [List<Object?>? arguments]) async {
    final db = await database;
    return await db.rawUpdate(sql, arguments);
  }

  // Permite executar DELETEs dinâmicos
  Future<int> rawDelete(String sql, [List<Object?>? arguments]) async {
    final db = await database;
    return await db.rawDelete(sql, arguments);
  }

  // ==========================================
  // MÉTODOS ESPECÍFICOS DE AUTENTICAÇÃO E UTILIZADOR
  // ==========================================

  Future<void> saveUser(Map<String, dynamic> user) async {
    final db = await database;
    await db.insert('users', user,
        conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<Map<String, dynamic>?> getUser() async {
    final db = await database;
    final maps = await db.query('users', limit: 1);
    if (maps.isNotEmpty) return maps.first;
    return null;
  }

  Future<void> deleteUser() async {
    final db = await database;
    await db.delete('users');
  }

  // ==========================================
  // MÉTODOS DE FILA OFFLINE (EVIDÊNCIAS)
  // ==========================================

  Future<void> addToEvidenceQueue(
      String endpoint, String method, String body) async {
    final db = await database;
    await db.insert('evidence_queue', {
      'endpoint': endpoint,
      'method': method,
      'body': body,
      'timestamp': DateTime.now().toIso8601String(),
    });
  }

  // ==========================================
  // MÉTODOS DE LEITURA DO CATÁLOGO DE BADGES
  // ==========================================

  /// Devolve a lista completa de todos os badges guardados localmente
  Future<List<Map<String, dynamic>>> listarBadges() async {
    final db = await database;
    return await db.rawQuery('SELECT * FROM badges'); //[cite: 4, 6]
  }

  /// Devolve o número total de badges atualmente no sqflite
  Future<int> contarBadges() async {
    final db = await database;
    int np = 0;

    final List<Map<String, dynamic>> result = await db.rawQuery(
      'SELECT COUNT(*) as count FROM badges', //
    );

    if (result.isNotEmpty && result.first['count'] != null) {
      np = result.first['count'] as int; //[cite: 6]
    }

    return np;
  }

  /// Guarda a data da última sincronização bem-sucedida
  Future<void> saveLastSyncDate(String date) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('last_sync_date', date);
  }

  Future<void> insertBadges(List<BadgeModel> badges) async {
    final db = await database;
    for (var badge in badges) {
      await db.rawInsert(
          'INSERT OR REPLACE INTO badges (id_badge, titulo, descricao, pontos) VALUES (?, ?, ?, ?)',
          [badge.id, badge.title, badge.description, badge.points]);
    }
  }

  /// Recupera a data da última sincronização (retorna null se nunca tiver ocorrido)
  Future<String?> getLastSyncDate() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('last_sync_date');
  }
}
