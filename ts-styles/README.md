## <ins>Welcome to the Quai.MD styles folder!</ins>

### Folders:

- _DO_NOT_IMPORT : folder contains consts and sass functions to be used internally in the styles folder.
  <br>This folder is not to be imported outside the folder unless you 100% know what you are doing.
  <br>If you are importing the palettes from this folder, you are probably **NOT** using the structure correctly, BAD!
  <br><br>

- components: folder contains individual component folders, each implementing our Sass Structure.
  <br><br>

- mixins: folder contains sass mixins to be used throughout the app, further instructions can be found
  in [mixins/_instructions](mixins/_instructions.md).
  <br><br>

### Sass Structure

The structure is defined as follows:

- Any component that shows up multiple times in the app **OR** has a specific light/dark theme design
  <br>should receive a designated folder under the components folder.
  <br><br>

- Individual component folders will contain the following:
    - A default.scss file - defines the default design of components in the app,
      <br>before individual usages in the app might overwrite it.
    - A lightTheme.scss file - defines the (light theme) values for the css vars the default file uses to define the design.
    - A darkTheme.scss file - defines the (dark theme) values for the css vars the default file uses to define the design.
      <br><br>
- Each css var in the light theme file should have a matching var in the dark theme file and vise versa.
  <br><br>
- The index file in this folder forwards the default designs, as well as binds together all the light/dark theme css vars under a single css selection.
