
# Bugs / Issues



# Priority todos

- Add full screen mode.


# Normal todos

- Add a new top toolbar button - 'Add current state to Undo history'.
- Clean up the css styling, it's a mess. Remove redundant styles, simplify dialog styles.
- Add a period/speed checker for oscillators and spaceships.
- Add a new option "Append pattern from Clipboard". It should create an active selection to be able to freely position the pattern.
- Create a nicer Light theme for the UI. The Dark mode is probably good enough.
- Add 'Center the pattern' and 'Best fit' buttons.
- Add 'Global Edit' tool - a dialog allowing to shift the pattern, center it, replace states, etc.
- Allow to display different shapes of cells: box, square, disc, circle. Only when cell size is >= 7. Use regular filled squares for smaller sizes.
- Create UI Designers for rules' definitions for supported CA families.
- Allow users to define their own CA engines (some sort of plugins).
- Add an alternate cell age coloring method for 2-state rules.
- Create a color palettes manager and designer.
- Export as image: let users export their patterns as images.
- Margolus engine - implement missing 'wrap' mode.
- Extract the Pattern Browser (left panel) to a separate component.
- Allow to save the left-top cell offset in .mcl format which should override automatic centering when loading the pattern. Important especially for Margolus patterns.
- Enable/disable undo and redo buttons in the toolbar depending on the history buffer state.
- Process 'Other' folder in 'Life' patterns.
- Add a new section to the Pattern Browser - 'Latest patterns'.
- Look at building a cross-platform desktop app - Electron?  That would allow pattern creators to conveniently work using local storage.


# Nice-to-haves

- Create a patterns submission mechanism.
- Create a patterns voting/ranking/liking/commenting system.
- Export as GIF/video: Let users export their simulations as animated GIFs or video files.
- Create unit tests for the code. One day.
- Create a back-end for the pattern storage (database, API, user accounts).
