import 'package:flutter/material.dart';

class Header extends StatefulWidget {
  /// Funkce, která se zavolá po tapnutí na hamburger ikonku.
  final VoidCallback? onHamburgerTap;

  const Header({super.key, this.onHamburgerTap});

  @override
  State<Header> createState() => _HeaderState();
}

class _HeaderState extends State<Header> {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      height: 80,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.tertiary,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(20),
          bottomRight: Radius.circular(20),
        ),
      ),
      child: Row(
        children: [
          // Hamburger ikona vlevo
          IconButton(
            icon: Icon(Icons.menu,
                color: Theme.of(context).colorScheme.onPrimary),
            onPressed: widget.onHamburgerTap,
          ),
          const SizedBox(width: 8),
          // Logo (uprostřed, nebo mírně doleva)
          Image.asset(
            'assets/icon/icon_removed_background.png',
            width: 60,
            height: 60,
            fit: BoxFit.contain,
          ),
          const Spacer(),
        ],
      ),
    );
  }
}
