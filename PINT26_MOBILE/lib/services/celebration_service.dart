import 'package:projeto_pratico/config/api_config.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CelebrationService {
  final String baseUrl = 'http://10.0.2.2:3000'; // Default for emulator, should use the one from your config

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? '';
  }
  
  Future<String> _getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('backend_url') ?? 'http://10.0.2.2:3000';
  }

  Future<List<dynamic>> fetchPendingCelebrations() async {
    final token = await _getToken();
    if (token.isEmpty) return [];
    
    final url = await _getBaseUrl();

    try {
      final response = await http.get(
        Uri.parse(ApiConfig.appendLang('$url/utilizador-marco/por-celebrar')),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        if (decoded['success'] == true && decoded['data'] != null) {
          return decoded['data'] as List<dynamic>;
        }
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching celebrations: $e');
      return [];
    }
  }

  Future<bool> markAsCelebrated(String idMarco) async {
    final token = await _getToken();
    if (token.isEmpty) return false;

    final url = await _getBaseUrl();

    try {
      final response = await http.put(
        Uri.parse(ApiConfig.appendLang('$url/utilizador-marco/$idMarco/celebrar')),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error marking celebration: $e');
      return false;
    }
  }
}
