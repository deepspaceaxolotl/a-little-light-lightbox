# A Little Light Lightbox
A lightweight, highly customizable and easy-to-use lightbox script reminiscent of Tumblr's lightbox, with video and touch support.

## Installation
The lightbox script comes with a Javascript file, a CSS stylesheet and two icons in the [`lightbox/`](lightbox/) directory. Including them on your webpage like any other JS file and CSS stylesheet is all that's needed, alongside making sure the URLs set for the icons in the CSS file are correct for your site.

Example:
```html
<link href="./lightbox.css" rel="stylesheet">
```
```html
<script src="./lightbox.js"></script>
```

Make sure to add `defer` to the `<script>` tag if it's before the body. The script needs to load after the document has loaded.
```html
<script defer src="./lightbox.js"></script>
```

If you want to add some animations, don't like having the next and previous image in a gallery to either side or want to change change any other settings, check the [options documentation](#options), or modify the code to your liking.

## Usage
### Content
Add the `data-lightbox` attribute to an element and set its `href` to link to the content you want to be opened in the lightbox when it's clicked on. (Leaving the `href` empty (`href=""`) will search for the first (currently displayed) image within the element and open that.)

#### Image
For example, to show a larger version of an image when a smaller thumbnail image is clicked on:
```html
<a href="image_large.png" data-lightbox><img src="image_small.png" alt="Example image"></a>
```

Supported image formats are listed in the table below.
| Format | Extension |
| --- | --- |
| APNG | .apng |
| AVIF | .avif |
| GIF | .gif |
| JPEG | .jpeg, .jpg |
| PNG | .png |
| SVG | .svg |
| WebP | .webp |

#### Video
The script also supports MP4 (`.mp4`), WebM (`.webm`) and Ogg (`.ogv`) videos. Set the `href` to the video URL and, if desired, add a track using the `data-video-track` attribute (in order, `src, kind, label, srclang`, if applicable, separated by commas). Currently, only one video source and track are supported this way.
```html
<a href="video.mp4" data-lightbox data-video-track="track_en.vtt, subtitles, English, en">A video!</a>
```

To embed a video YouTube, Vimeo or Dailymotion, set the `href` to the video URL with any desired URL parameters included.
```html
<a href="https://www.youtube.com/watch?v=[video ID]&autoplay=1" data-lightbox>A video!</a>
```

#### QuerySelector
You can also set the `href` to `querySelector:` followed by a selector for an `img`, `video`, `figure` or `picture` element somewhere in the document to load that instead. Other options applied using the `data` attributes will still apply, with the `data-video-type` attribute being applied only for a fallback video file.

```html
<a href="querySelector: [alt='Another image']" data-lightbox><img src="image_small.png" alt="Example image"></a>
<img src="image_2.png" alt="Another image">
```

### Gallery
Set a value for the `data-lightbox` attribute for each desired element to open them all in a gallery.
```html
<a href="image_1.png" data-lightbox="gallery one"><img src="image_1_small.png" alt="Example image 1"></a>
<a href="image_2.png" data-lightbox="gallery one"><img src="image_2_small.png" alt="Example image 2"></a>
<a href="https://www.youtube.com/watch?v=[video ID]" data-lightbox="gallery one">A video!</a>
```

Navigation is possible using buttons or previews of the next/previous image on either side (optional, next/previous videos always result in a button), clicking on the image (left third to go back if possible, the rest to go forwards) or using arrow keys. On touch-capable devices, navigation is also possible by swiping far enough anywhere on the screen (if the content displayed is a video, the swipe action cannot begin on the video itself).

Tab navigation is fully supported with a focus trap, and the gallery can be exited by clicking the close button (if present), clicking anywhere outside of the image/video, or using the escape key.

### Captions
Captions can be set for each item using the `data-caption` attribute, which supports HTML tags such as `<br>` or `<i>` and wraps automatically.
```html
<a href="image_large.png" data-lightbox data-caption="This is <br> a multiline <i>caption</i>"><img src="image_small.png" alt="Example image"></a>
```

### Image alt text
When opening an image, you can set its alt text using the `data-image-alt` attribute. Otherwise, the script will check for an image within the HTML tag with the `data-lightbox` attribute for its alt text. (Of course, if it's not the same image, that alt text might be inaccurate.)
```html
<a href="image_large.png" data-lightbox data-image-alt="Larger image"><img src="image_small.png" alt="Example image"></a>
```

### Image srcset
Images can have a `srcset` set using the `data-image-srcset` attribute.
```html
<a href="image_large.png" data-lightbox data-image-alt="Larger image" data-image-srcset="image_large.png, image_large_retina.png 2x"><img src="image_small.png" alt="Example image"></a>
```

### Image fallback
Fallback images which will load if the image linked to in the `href` fails to load can be set using the `data-fallback-image` attribute.
```html
<a href="image_large.png" data-lightbox data-image-alt="Larger image" data-fallback-image="image_large_fallback.png"><img src="image_small.png" alt="Example image"></a>
```

## Data Attributes
The following data attributes can be added to the target element.
| Attribute | Usage |
| --- | --- |
| `data-lightbox` | initializes the lightbox; set a value to group items in a gallery |
| `data-lightbox-options` | see [options](#options) |
| `data-caption` | caption to show under content; supports HTML |
| `data-image-alt` | alt for image that will be shown |
| `data-image-srcset` | specify `srcset` for the linked image |
| `data-fallback-image` | fallback image or video URL in case content fails to load |
| `data-video-options` | specify attributes for `<video>` element, with `="false"` or `="0"` after them or prefixing them with a `!` removing the attribute |
| `data-video-track` | adds a `<track>` element to video file |
| `data-video-type` | video type, in case codecs need specifying (otherwise, will be set according to file extension) |

## Options
There are many options that can be set to change the behavior of the lightbox.
| Property | Possible values | Default value | Usage |
| --- | --- | --- | --- |
| `all` | `null`, `'gallery'`, `'single'` | `null` | setting this to `'single'` will ignore any gallery groupings, while setting it to `'gallery'` will include all images on the page in one big gallery |
| `animated` | `true`, `false` | `false` | fading and scaling animations |
| `carousel` | `true`, `false` | `false` | makes galleries loop |
| `fallbackswap` | `true`, `false`, | `true` | whether loading a fallback image/video will also replace the broken resource link in the relevant elements; has no effect on `<video>` elements found via [querySelector](#queryselector) |
| `loaderimage` | `string` (an image url) | `null` (loads a 1x1 px invisible gif) | loading image for videos |
| `sideimages` | `true`, `false` | `true` | displays previous and next images on either side, which can be used to navigate |
| `buttons.attached` | `true`, `false` | `false` | attaches buttons to the currently displayed item (CSS tweaking recommended) |
| `buttons.close` | `true`, `false` | `true` | displays the close button |
| `buttons.nav` | `true`, `false` | `true` | displays navigation buttons (by default only on small screens or for videos, set CSS `--lightbox-button-display` property to `initial` to always show (turning off `sideimages` will do this automatically)) |
| `video.autoplay` | `true`, `false` | `false` | autoplay video |
| `video.controls` | `true`, `false` | `true` | show video controls |
| `video.muted` | `true`, `false` | `false` | start video muted |
| `animation.fadeIn` | `string` (a CSS animation property), `null` | `'fadeIn .3s forwards'` | fade in animation |
| `animation.fadeOut` | `string` (a CSS animation property), `null` | `'fadeOut .3s forwards'` | fade out animation |
| `animation.scaleIn` | `string` (a CSS animation property), `null` | `'scaleIn .3s forwards'` | scale in animation |
| `animation.scaleOut` | `string` (a CSS animation property), `null` | `'scaleOut .3s forwards'` | scale out animation |

These can be set globally for the page the lightbox has been initialized in, or for each gallery of images/videos using the `data-lightbox-options` attribute (or you can change them in the JS file itself to apply everywhere).

### Setting options globally
To set them globally for the page, include a script tag near the top of the page and set the options using `window.lightboxOptions`, like so:
```html
<script>
    window.lightboxOptions = {
        carousel: true,
        buttons: {
            attached: false,
        },
        video: {
            autoplay: true,
        },
        animated: true,
        animation: {
            fadeIn: 'fadeIn .5s forwards',
            fadeOut: 'fadeOut .5s forwards',
            scaleIn: null,
            scaleOut: null,
        },
    };
</script>
```

If using any software that bundles scripts together, make sure to turn that off, such as by adding the `is:inline` attribute to the `<script>` tag in [Astro](https://astro.build/).

### Setting options locally
To set options locally for a gallery, list any properties you want set along with their values in the `data-lightbox-options` attribute, separated by commas. When setting them like this, any boolean properties can be set to `true` with just the name of the property, or to `false` by prefixing it with a `!`. If setting them explicitly, `1` and `0` can also be used in place of `true` and `false`, respectively. Other values will be read as strings, except for `null`.
```html
<a href="image.png" data-lightbox data-lightbox-options="autoplay, !buttons.attached, animated, animation.fadeIn = fadeIn .5s forwards, animation.fadeOut = fadeOut .5s forwards, animation.scaleIn = null, animation.scaleOut = null">example</a>
// whitespace before and after each property will be trimmed, as well as around the = sign
<a href="image.png" data-lightbox data-lightbox-options="autoplay=true, buttons.attached=false, animated=1">example</a>
```

### Order of Precedence
> [!TIP]
> When changing the behavior of the lightbox, options have the following order of precedence, in descending order:
> 
> 1. `data-video-options` / video URL parameters
> 2. `data-lightbox-options`
> 3. global options
> 4. default options
> 
> Additionally, the `data-video-type` attribute overrides any automatically discovered `type`, except for when targeting a `<video>` element using the [querySelector](#queryselector) feature, where it will only be applied for a set fallback video file.

### Styling
The included CSS file contains all the styles necessary for the lightbox. A few variables are provided for easy customization.
| Variable | Default | Usage |
| --- | --- | --- |
| `--lightbox-bg-color` | `rgba(29, 29, 29, 0.8)` | lightbox background backdrop color |
| `--lightbox-button-color` | `brightness(0.9)` | `filter` for button SVG color |
| `--lightbox-button-display` | `none` | `none` to hide buttons on wider screens where side images can be displayed, `initial` to always show |
| `--lightbox-button-display-disabled` | `initial` | `initial` to show disabled buttons (greyed out),  `none` hide them |
| `--lightbox-margins` | `5vh` | overall margins |
| `--lightbox-side-margins` | `7vw` | side image offset |
| `--lightbox-button-size` | `36px` | button size |
| `--lightbox-caption-height` | `0px` | for video support, should not be modified |
| `--lightbox-close-button` | `url('icons/icon-lightbox-close.svg')` | close button image |
| `--lightbox-arrow-button` | `url('icons/icon-lightbox-arrow.svg')` | arrow buttons image |

## Known Issues
- .gifv support not yet implemented
- URL parameter to turn off automatic recommendations for Dailymotion unclear
- Fallback image or video for embedded videos (iframes) is hard to implement
- Some fallback video bugs in certain mobile browsers (e.g. Safari)
- Information on mobile browser support is incomplete
- No polyfills for legacy browser compatibility

Help is very welcome!

## Browser Support
| | Chrome | Firefox | Safari[^1] | Opera[^1] | Edge | Chrome Android | Firefox for Android | Opera Android | Safari on iOS | Samsung Internet | WebView Android |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| full support | 88+ | 89+ | 15+ | 56+ | 88+ | 108+ | 101+ | 73+ | 15.4+ | 21.0+ | 108+ |
| fallback exists for lack of `aspect-ratio` CSS support | 69+ | 69+ | 15+ | 56+ | 79+ | [^2] | [^2] | [^2] | [^2] | [^2] | [^2]

> [!CAUTION]
> Opera Mini isn't supported due to missing features.

> [!NOTE]
> Mobile browser support information is incomplete, only checked for `svh` support.

[^1]: Desktop Safari and Opera currently lack full touch event support.
[^2]: Embedded video wrappers could be affected due to lack of support for `svh` on lower versions.

## Credits
[Victor Diego](https://victordiego.com) for [Lightbox.js](https://github.com/victordieggo/lightbox.js/), on which this script was based.

The [Fandom Coders](https://fancoders.com/) Discord server, for all their help and patience.

## License
MIT License © deepspaceaxolotl

This software is based on [Lightbox.js](https://github.com/victordieggo/lightbox.js/); [MIT License](https://victordieggo.mit-license.org/) © [Victor Diego Villar Guimarães](https://victordiego.com)
