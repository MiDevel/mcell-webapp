
# Bugs / Issues

- 


# Critical todos

- Bug: some selection operations do not go to Undo/Redo buffer as they should.
- Configuration for default board parameters, not specified in patterns being loaded. Allow to either keep current or use configured values.


# Other todos

- Add full screen mode.
- Bug: when opening a new pattern the old selection stays active. Just trash it.
- Clean up the css styling, it's a mess. Remove redundant styles.
- Create one common css file for all dialogs.
- Create a nicer Light theme for the UI. The Dark mode is probably good enough.
- Add 'Global Edit' tool - shift the pattern, center it, replace states, etc.
- Allow to display different shapes of cells: box, square, disc, circle. Only when cell size is >= 7. Use regular filled squares for smaller sizes.
- Create UI Designers for rules' definitions for all supported CA families.
- Allow users to define their own CA engines (some sort of plugins).
- Add a period/speed checker for oscillators and spaceships.
- Export as image: Let users export their simulations as images.
- Margolus engine - implement the missing 'wrap' mode.
- Allow to save the left-top cell offset in .mcl format which should override automatic centering when loading the pattern. Important for Margolus patterns.
- Enable/disable undo and redo buttons when appropriate.
- Process 'Other' folder in 'Life' patterns.
- Adda new section to the Pattern Browser for 'New


# Nice-to-haves

- Create some patterns submission mechanism.
- Extract the Pattern Browser (left panel) to a separate component.
- Create a patterns voting/ranking/liking/commenting system.
- Export as GIF/video: Let users export their simulations as animated GIFs or video files.
- Create unit tests for the code.

