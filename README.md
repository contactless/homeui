    ******************************************************
                    _                  __
                   | |                / _|
      ___ ____   __| |__   ___  _ __ | |_ ____ _    __  __
     / __/_-. \/ __| '_ \ / _ \| '_ \|  _/_-. \ \  / / / /
    | (__,--' | |  | |_) | (_) | | | | | ,--' |\ \/ / / /
     \___\__,_|_|  |_.__/ \___/|_| |_|_| \__,_| \  / / /
                                                /_/ /_/

    *                                                    *
    *   Made by Carbonfay & Contactless                  *
    *                                                    *
    *   http://carbonfay.ru     support@carbonfay.ru     *
    *   http://contactless.ru   support@contactless.ru   *
    *                                                    *
    ******************************************************

# homeui

This project is generated with [yo angular generator](https://github.com/yeoman/generator-angular)
version 0.11.1.

# MQTT naming conventions

See into conventions.md to understand how to organize devices and controls (what write to /meta/type for example).

## Build & development

Run `grunt` for building and `grunt serve` for preview.

## Testing

Running `grunt test` will run the unit tests with karma.

# Documentation

## Multipe WebUI

Change value in .env file

**Multiple account disabled:**

```
WEBUI_MULTIPLE=false
```

**Multipe account enabled:**

```
WEBUI_MULTIPLE=true
```