
# Bugs / Issues

- 


# Critical todos

- Bug: some selection operations do not go to Undo/Redo buffer as they should.
- Configuration for default board parameters, used if not specified in patterns being loaded. Allow to either keep current or use configured values.


# Other todos

- Add full screen mode.
- Add a new top toolbar button - 'Add state to Undo history'.
- Bug: when opening a new pattern the old selection stays active. Just trash it.
- Clean up the css styling, it's a mess. Remove redundant styles, simplify dialog styles.
- Add a period/speed checker for oscillators and spaceships.
- Create a nicer Light theme for the UI. The Dark mode is probably good enough.
- Add 'Global Edit' tool - a dialog allowing to shift the pattern, center it, replace states, etc.
- Allow to display different shapes of cells: box, square, disc, circle. Only when cell size is >= 7. Use regular filled squares for smaller sizes.
- Create UI Designers for rules' definitions for all supported CA families.
- Allow users to define their own CA engines (some sort of plugins).
- Export as image: Let users export their simulations as images.
- Margolus engine - implement the missing 'wrap' mode.
- Allow to save the left-top cell offset in .mcl format which should override automatic centering when loading the pattern. Important for Margolus patterns.
- Enable/disable undo and redo buttons when appropriate.
- Process 'Other' folder in 'Life' patterns.
- Add a new section to the Pattern Browser - 'New patterns'.


# Nice-to-haves

- Create some patterns submission mechanism.
- Extract the Pattern Browser (left panel) to a separate component.
- Create a patterns voting/ranking/liking/commenting system.
- Export as GIF/video: Let users export their simulations as animated GIFs or video files.
- Create unit tests for the code.
- Create a backend for the pattern storage (database, API, user accounts).
