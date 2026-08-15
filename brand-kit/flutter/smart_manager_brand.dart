import 'package:flutter/material.dart';

/// Source-preserving Smart Manager logo helpers.
///
/// Copy the corresponding official assets from the packaged brand kit into
/// `assets/brand/` before using these widgets in a Flutter application.
class SmartManagerBrand {
  static const Color primary = Color(0xFF00A651);
  static const Color secondary = Color(0xFF008A45);
  static const Color dark = Color(0xFF101828);
  static const String _iconAsset = 'assets/brand/smart-manager-app-icon-512.png';
  static const String _fullAsset = 'assets/brand/smart-manager-official-master.png';

  static Widget icon({double size = 48, String? semanticLabel}) {
    return Semantics(
      label: semanticLabel ?? 'Smart Manager',
      image: true,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(size * 0.22),
        child: Image.asset(_iconAsset, width: size, height: size, fit: BoxFit.contain),
      ),
    );
  }

  static Widget horizontal({Color wordmarkColor = Colors.white, bool showSlogan = true}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        icon(size: 42),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('SMART MANAGER', style: TextStyle(color: wordmarkColor, fontSize: 15, fontWeight: FontWeight.w800, letterSpacing: -0.4)),
            if (showSlogan)
              Text('SIMAMIA BIASHARA YAKO. POPOTE, WAKATI WOTE.', style: TextStyle(color: primary, fontSize: 7.5, fontWeight: FontWeight.w700, letterSpacing: 0.6)),
          ],
        ),
      ],
    );
  }

  static Widget full({double width = 260}) {
    return Semantics(
      label: 'Smart Manager — Simplify. Manage. Grow.',
      image: true,
      child: Image.asset(_fullAsset, width: width, fit: BoxFit.contain),
    );
  }
}
