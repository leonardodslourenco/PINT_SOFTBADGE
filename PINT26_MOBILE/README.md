# SoftBadge - Aplicação Móvel (Flutter)

Aplicação móvel multiplataforma (Android / iOS) destinada ao perfil de Consultor na plataforma SoftBadge. Permite consultar o catálogo de *badges*, submeter evidências por requisito, acompanhar o estado das candidaturas e exportar ou partilhar certificados.

Para mais detalhes sobre a organização das pastas e o fluxo de estados, consultar [`estrutura_projeto_mobile.md`](./estrutura_projeto_mobile.md).

## Tecnologias

- Flutter 3 / Dart
- Riverpod (`flutter_riverpod`) para gestão de estado
- SQLite (`sqflite`) para persistência local de sessão e cache
- `http` para consumo da API REST
- `pdf` e `printing` para pré-visualização e geração de certificados
- `flutter_local_notifications` e Firebase Cloud Messaging para alertas
- Internacionalização (`l10n`) em Português, Inglês e Espanhol

## Execução Local

```bash
flutter pub get
flutter gen-l10n
flutter run
```

O URL da API está definido em `lib/config/api_config.dart`.
