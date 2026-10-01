import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/storage_service.dart';
import 'storage_provider.dart';

/// Theme mode notifier
/// Manages light/dark theme preference
class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final StorageService _storage;

  ThemeModeNotifier(this._storage) : super(ThemeMode.system) {
    _initialize();
  }

  Future<void> _initialize() async {
    final isDark = _storage.getDarkMode();
    if (isDark != null) {
      state = isDark ? ThemeMode.dark : ThemeMode.light;
    } else {
      state = ThemeMode.system;
    }
  }

  /// Toggle between light and dark
  Future<void> toggleTheme() async {
    if (state == ThemeMode.dark) {
      state = ThemeMode.light;
      await _storage.saveDarkMode(false);
    } else {
      state = ThemeMode.dark;
      await _storage.saveDarkMode(true);
    }
  }

  /// Set specific theme mode
  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    if (mode == ThemeMode.system) {
      // Clear preference to use system default
      await _storage.clearPreferences();
    } else {
      await _storage.saveDarkMode(mode == ThemeMode.dark);
    }
  }
}

/// Theme mode provider
final themeModeProvider =
    StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return ThemeModeNotifier(storage);
});
