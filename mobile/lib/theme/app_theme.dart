import 'package:flutter/material.dart';

/// Color tokens used throughout the app
/// Centralized color definitions - never hardcode colors in widgets
class AppColors {
  // Primary brand color
  static const primary = Color(0xFF4F46E5); // Indigo-600
  static const primaryLight = Color(0xFF818CF8); // Indigo-400
  static const primaryDark = Color(0xFF3730A3); // Indigo-800

  // Semantic colors
  static const success = Color(0xFF16A34A); // Green-600 (positive balance, "you are owed")
  static const danger = Color(0xFFDC2626); // Red-600 (negative balance, "you owe", delete)
  static const warning = Color(0xFFF59E0B); // Amber-500 (pending, unsettled)
  static const info = Color(0xFF0EA5E9); // Sky-500

  // Neutral colors (light theme)
  static const lightSurface = Color(0xFFF8FAFC); // Slate-50
  static const lightBackground = Color(0xFFFFFFFF);
  static const lightOnSurface = Color(0xFF0F172A); // Slate-900
  static const lightOnBackground = Color(0xFF1E293B); // Slate-800
  static const lightBorder = Color(0xFFE2E8F0); // Slate-200

  // Neutral colors (dark theme)
  static const darkSurface = Color(0xFF1E293B); // Slate-800
  static const darkBackground = Color(0xFF0F172A); // Slate-900
  static const darkOnSurface = Color(0xFFF1F5F9); // Slate-100
  static const darkOnBackground = Color(0xFFE2E8F0); // Slate-200
  static const darkBorder = Color(0xFF334155); // Slate-700
}

/// Custom theme extension for semantic colors not covered by Material's ColorScheme
/// Access via: Theme.of(context).extension<AppSemanticColors>()!.success
@immutable
class AppSemanticColors extends ThemeExtension<AppSemanticColors> {
  const AppSemanticColors({
    required this.success,
    required this.danger,
    required this.warning,
    required this.info,
    required this.onSuccess,
    required this.onDanger,
    required this.onWarning,
    required this.onInfo,
  });

  final Color success;
  final Color danger;
  final Color warning;
  final Color info;
  final Color onSuccess;
  final Color onDanger;
  final Color onWarning;
  final Color onInfo;

  @override
  AppSemanticColors copyWith({
    Color? success,
    Color? danger,
    Color? warning,
    Color? info,
    Color? onSuccess,
    Color? onDanger,
    Color? onWarning,
    Color? onInfo,
  }) {
    return AppSemanticColors(
      success: success ?? this.success,
      danger: danger ?? this.danger,
      warning: warning ?? this.warning,
      info: info ?? this.info,
      onSuccess: onSuccess ?? this.onSuccess,
      onDanger: onDanger ?? this.onDanger,
      onWarning: onWarning ?? this.onWarning,
      onInfo: onInfo ?? this.onInfo,
    );
  }

  @override
  AppSemanticColors lerp(ThemeExtension<AppSemanticColors>? other, double t) {
    if (other is! AppSemanticColors) {
      return this;
    }
    return AppSemanticColors(
      success: Color.lerp(success, other.success, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      info: Color.lerp(info, other.info, t)!,
      onSuccess: Color.lerp(onSuccess, other.onSuccess, t)!,
      onDanger: Color.lerp(onDanger, other.onDanger, t)!,
      onWarning: Color.lerp(onWarning, other.onWarning, t)!,
      onInfo: Color.lerp(onInfo, other.onInfo, t)!,
    );
  }
}

/// Light theme configuration
final ThemeData lightTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  
  // Color scheme
  colorScheme: ColorScheme.light(
    primary: AppColors.primary,
    onPrimary: Colors.white,
    primaryContainer: AppColors.primaryLight,
    onPrimaryContainer: AppColors.primaryDark,
    
    secondary: AppColors.primaryLight,
    onSecondary: Colors.white,
    
    error: AppColors.danger,
    onError: Colors.white,
    
    surface: AppColors.lightSurface,
    onSurface: AppColors.lightOnSurface,
    
    background: AppColors.lightBackground,
    onBackground: AppColors.lightOnBackground,
    
    outline: AppColors.lightBorder,
  ),

  // Scaffold
  scaffoldBackgroundColor: AppColors.lightBackground,

  // App bar
  appBarTheme: const AppBarTheme(
    backgroundColor: AppColors.lightBackground,
    foregroundColor: AppColors.lightOnBackground,
    elevation: 0,
    centerTitle: false,
    titleTextStyle: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      color: AppColors.lightOnBackground,
    ),
  ),

  // Card
  cardTheme: CardTheme(
    color: AppColors.lightBackground,
    elevation: 1,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: const BorderSide(color: AppColors.lightBorder, width: 1),
    ),
  ),

  // Elevated button
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      elevation: 0,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),

  // Text button
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: AppColors.primary,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),

  // Outlined button
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: AppColors.primary,
      side: const BorderSide(color: AppColors.primary, width: 1.5),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),

  // Input decoration
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: AppColors.lightSurface,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.lightBorder),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.lightBorder),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.primary, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.danger),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
  ),

  // Bottom navigation bar
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: AppColors.lightBackground,
    selectedItemColor: AppColors.primary,
    unselectedItemColor: AppColors.lightOnSurface,
    type: BottomNavigationBarType.fixed,
    elevation: 8,
  ),

  // Divider
  dividerTheme: const DividerThemeData(
    color: AppColors.lightBorder,
    thickness: 1,
    space: 1,
  ),

  // Typography
  textTheme: const TextTheme(
    displayLarge: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.bold,
      color: AppColors.lightOnBackground,
    ),
    displayMedium: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.bold,
      color: AppColors.lightOnBackground,
    ),
    displaySmall: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.bold,
      color: AppColors.lightOnBackground,
    ),
    headlineMedium: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      color: AppColors.lightOnBackground,
    ),
    titleLarge: TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.w600,
      color: AppColors.lightOnBackground,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: AppColors.lightOnBackground,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.normal,
      color: AppColors.lightOnSurface,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.normal,
      color: AppColors.lightOnSurface,
    ),
    bodySmall: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.normal,
      color: AppColors.lightOnSurface,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      color: AppColors.lightOnSurface,
    ),
  ),

  // Custom semantic colors extension
  extensions: const <ThemeExtension<dynamic>>[
    AppSemanticColors(
      success: AppColors.success,
      danger: AppColors.danger,
      warning: AppColors.warning,
      info: AppColors.info,
      onSuccess: Colors.white,
      onDanger: Colors.white,
      onWarning: Colors.white,
      onInfo: Colors.white,
    ),
  ],
);

/// Dark theme configuration
final ThemeData darkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  
  // Color scheme
  colorScheme: ColorScheme.dark(
    primary: AppColors.primaryLight,
    onPrimary: AppColors.darkBackground,
    primaryContainer: AppColors.primary,
    onPrimaryContainer: Colors.white,
    
    secondary: AppColors.primaryLight,
    onSecondary: AppColors.darkBackground,
    
    error: AppColors.danger,
    onError: Colors.white,
    
    surface: AppColors.darkSurface,
    onSurface: AppColors.darkOnSurface,
    
    background: AppColors.darkBackground,
    onBackground: AppColors.darkOnBackground,
    
    outline: AppColors.darkBorder,
  ),

  // Scaffold
  scaffoldBackgroundColor: AppColors.darkBackground,

  // App bar
  appBarTheme: const AppBarTheme(
    backgroundColor: AppColors.darkBackground,
    foregroundColor: AppColors.darkOnBackground,
    elevation: 0,
    centerTitle: false,
    titleTextStyle: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      color: AppColors.darkOnBackground,
    ),
  ),

  // Card
  cardTheme: CardTheme(
    color: AppColors.darkSurface,
    elevation: 2,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: const BorderSide(color: AppColors.darkBorder, width: 1),
    ),
  ),

  // Elevated button
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.primaryLight,
      foregroundColor: AppColors.darkBackground,
      elevation: 0,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),

  // Text button
  textButtonTheme: TextButtonThemeData(
    style: TextButton.styleFrom(
      foregroundColor: AppColors.primaryLight,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),

  // Outlined button
  outlinedButtonTheme: OutlinedButtonThemeData(
    style: OutlinedButton.styleFrom(
      foregroundColor: AppColors.primaryLight,
      side: const BorderSide(color: AppColors.primaryLight, width: 1.5),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      ),
    ),
  ),

  // Input decoration
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: AppColors.darkSurface,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.darkBorder),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.darkBorder),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.primaryLight, width: 2),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: AppColors.danger),
    ),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
  ),

  // Bottom navigation bar
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: AppColors.darkSurface,
    selectedItemColor: AppColors.primaryLight,
    unselectedItemColor: AppColors.darkOnSurface,
    type: BottomNavigationBarType.fixed,
    elevation: 8,
  ),

  // Divider
  dividerTheme: const DividerThemeData(
    color: AppColors.darkBorder,
    thickness: 1,
    space: 1,
  ),

  // Typography
  textTheme: const TextTheme(
    displayLarge: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.bold,
      color: AppColors.darkOnBackground,
    ),
    displayMedium: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.bold,
      color: AppColors.darkOnBackground,
    ),
    displaySmall: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.bold,
      color: AppColors.darkOnBackground,
    ),
    headlineMedium: TextStyle(
      fontSize: 20,
      fontWeight: FontWeight.w600,
      color: AppColors.darkOnBackground,
    ),
    titleLarge: TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.w600,
      color: AppColors.darkOnBackground,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w600,
      color: AppColors.darkOnBackground,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.normal,
      color: AppColors.darkOnSurface,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.normal,
      color: AppColors.darkOnSurface,
    ),
    bodySmall: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.normal,
      color: AppColors.darkOnSurface,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w600,
      color: AppColors.darkOnSurface,
    ),
  ),

  // Custom semantic colors extension
  extensions: const <ThemeExtension<dynamic>>[
    AppSemanticColors(
      success: AppColors.success,
      danger: AppColors.danger,
      warning: AppColors.warning,
      info: AppColors.info,
      onSuccess: Colors.white,
      onDanger: Colors.white,
      onWarning: Colors.white,
      onInfo: Colors.white,
    ),
  ],
);
