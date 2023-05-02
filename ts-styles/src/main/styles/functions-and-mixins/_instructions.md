# Mixins

### more information on mixins can be found [here](https://sass-lang.com/documentation/at-rules/mixin)

## What are mixins?

Mixins are a directive that lets you create CSS rules that is reused throughout the app.<br>
A mixin allows you to make groups of CSS rules that are reusable and have a bit of functionality with the passing of arguments.

## Creating a mixin

We create a mixin with the @mixin keyword:

- example without arguments:

```scss
@mixin example {
  //css code here
}
```

- example with arguments:

```scss
@mixin example($argument) {
  //css code here
  css-rule: $argument
}
```

## Using mixins

Mixins are used with the @include keyword, like this:

```scss
@mixin setFont($size, $weight) {
  font-size: $size;
  font-weight: $weight;
}

@mixin flex {
  display: flex;
  justify-content: center;
  align-items: center;
}

.example-class {
  @include setFont(14px, bold);
  @include flex;
}
```

this will translate the class into this:

```scss
.example-class {
  font-size: 14px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-content: center;
}
```

## In our app

we can use mixins by importing them using the @use keyword:

- Importing as part of the "styles" general import: <br>If we want to import mixins and don't care about name-spacing them differently we can do this

```scss
@use "@res/styles" as styles;

.example-class {
  @include styles.example-mixin;
}
```

- Importing as its own namespace, separate from other imports:

```scss
@use "@res/styles/mixins" as mixins;
@use "@res/styles/colors" as colors;

.example-class {
  @include mixins.example-mixin;
}
```

## Why @use and not @import

@use as the name suggests only uses the files content to resolve the mixin calls in compile time.<br>
@import on the other hand copies the content of the target file into the importing file.
this can easily cause class duplications and overwrites.<br>
basically, if you aren't 100% sure you need to use @import, use @use.

