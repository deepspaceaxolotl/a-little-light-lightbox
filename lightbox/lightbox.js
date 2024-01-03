/* =====================================================================
 * A Little Light Lightbox
 * Version: 1.0.0
 * Author: deepspaceaxolotl
 * License: MIT
 * This software is based on:
 * | Lightbox.js
 * | Version: 0.1.0
 * | Author: Victor Diego <victordieggo@gmail.com>
 * | License: MIT
 * ================================================================== */

(function lightbox() {

	'use strict';

	class LightboxError extends Error {};

	let lightboxOptions = {
		all: null,
		animated: false,
		carousel: false,
		fallbackswap: true,
		loaderimage: null,
		sideimages: true,
		...window.lightboxOptions,
		buttons: {
			attached: false,
			close: true,
			nav: true,
			...window.lightboxOptions?.buttons,
		},
		video: {
			autoplay: false,
			controls: true,
			muted: false,
			...window.lightboxOptions?.video,
		},
		animation: {
			fadeIn: 'fadeIn .3s forwards', // default .3s
			fadeOut: 'fadeOut .3s forwards', // default .3s
			scaleIn: 'scaleIn .3s forwards', // default .3s
			scaleOut: 'scaleOut .3s forwards', // default .3s
			...window.lightboxOptions?.animation,
		},
	};
	const defaultOptions = JSON.parse(JSON.stringify(lightboxOptions));
	const body = document.body;
	const video = [];
	let touchSensitivity = 70; // distance from click that will activate swipe, default 70
	let btnClose, btnNav, currentItem, box, container, nextContainer, previousContainer, content, nextContent, previousContent, currentImage, nextImage, previousImage, selector, index, galleryItems, gallerySides, currentVideo, videoRan, fallbackToImage, imageResizing, pictureResizing, prevBox, imgarray, caption, currentTrigger, touchstartX, touchstartY, touchendX, touchendY, focusable;
	let singleTouch = 0, wasTabbed = 0;
	let trigger = document.querySelectorAll('[data-lightbox]');

	function ifDefined(argument, check) {
		if (argument === undefined) {
			return false;
		}
		return check();
	};

	function toggleScroll() {
		body.classList.toggle('remove-scroll');
	};

	const validators = {
		all: (value) => [null, 'gallery', 'single'].includes(value),
		animated: (value) => typeof value === 'boolean',
		carousel: (value) => typeof value === 'boolean',
		fallbackswap: (value) => typeof value === 'boolean',
		loaderimage: (value) => typeof value === 'string' || value === null,
		sideimages: (value) => typeof value === 'boolean',
		buttons: {
			attached: (value) => typeof value === 'boolean',
			close: (value) => typeof value === 'boolean',
			nav: (value) => typeof value === 'boolean',
		},
		video: {
			autoplay: (value) => typeof value === 'boolean',
			controls: (value) => typeof value === 'boolean',
			muted: (value) => typeof value === 'boolean',
		},
		animation: {
			fadeIn: (value) => typeof value === 'string' || value === null,
			fadeOut: (value) => typeof value === 'string' || value === null,
			scaleIn: (value) => typeof value === 'string' || value === null,
			scaleOut: (value) => typeof value === 'string' || value === null,
		},
	}

	function validateOptions() {
		for (const prop in lightboxOptions) {
			if (typeof validators[prop] === 'object') {
				for (const prop2 in lightboxOptions[prop]) {
					if (!(prop2 in validators[prop])) {
						throw new LightboxError(`Unexpected property "${prop}.${prop2}" in lightboxOptions`);
					} else if (!validators[prop][prop2](lightboxOptions[prop][prop2])) {
						throw new LightboxError(`Unsupported value set for property "${prop}.${prop2}" in lightboxOptions`);
					}
				}
			} else {
				if (!(prop in validators)) {
					throw new LightboxError(`Unexpected property "${prop}" in lightboxOptions`);
				} else if (!validators[prop](lightboxOptions[prop])) {
					throw new LightboxError(`Unsupported value set for property "${prop}" in lightboxOptions`);
				}
			}
		}
	}

	function addLoader() {
		let loader = document.createElement('img');
		if (lightboxOptions.loaderimage !== null) {
			loader.src = lightboxOptions.loaderimage;
		} else {
			loader.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
		}
		loader.alt = 'loading...';
		let loaderDiv = document.createElement('div');
		loaderDiv.className = 'lightbox-loader';
		loaderDiv.appendChild(loader);
		content.appendChild(loaderDiv);
		video.player.addEventListener('load', removeLoader);
	}

	function removeLoader() {
		content.querySelectorAll('.lightbox-loader').forEach(e => e.parentNode.removeChild(e));
	}

	function imageResize() {
		let image = content.children[0];
		content.style.width = image.clientWidth + 'px';
	};

	function pictureReload() {
		let picture = content.querySelector('picture');
		picture.style.width = picture.querySelector('img').clientWidth + 'px';
	};

	function pictureResize() {
		let picture = content.querySelector('picture');
		if (picture != null) {
			picture.style.width = picture.querySelector('img').clientWidth + 'px';
			picture.querySelector('img').addEventListener('load', pictureReload);
		}
	};

	function resizers() {
		if (!currentVideo) {
			let picture = content.querySelector('picture');
			if (pictureResizing === undefined && picture != null) {
				pictureResizing = new ResizeObserver(pictureResize);
				pictureResizing.observe(picture);
			}
			if (imageResizing === undefined) {
				imageResizing = new ResizeObserver(imageResize);
				imageResizing.observe(content);
			}
		} else if (container.contains(caption)) {
			function captionCalc() {
				let captionMarTop = window.getComputedStyle(caption).getPropertyValue('margin-top');
				let captionMarBottom = window.getComputedStyle(caption).getPropertyValue('margin-bottom');
				let captionHeight = caption.children[0].offsetHeight + parseFloat(captionMarTop.substring(0, captionMarTop.length - 2)) + parseFloat(captionMarBottom.substring(0, captionMarBottom.length - 2)) + 3;
				document.documentElement.style.setProperty('--lightbox-caption-height', captionHeight + 'px');
			};
			captionCalc();
			screen.orientation.addEventListener('change', function () {
				if (container.contains(caption)) {
					captionCalc();
				} else {
				document.documentElement.style.setProperty('--lightbox-caption-height', 0 + 'px');
				}
			});
		} else {
			document.documentElement.style.setProperty('--lightbox-caption-height', 0 + 'px');
		}
	}

	function sortContent(el) {
		const href = el.getAttribute('href');
		const internal = el.querySelector('img');
		function videoTypes(source, url) {
			if (el.dataset.videoType != null) {
				source.type = el.dataset.videoType;
			} else if (url.match(/\.mp4/)) {
				source.type = 'video/mp4';
			} else if (url.match(/\.webm/)) {
				source.type = 'video/webm';
			} else if (url.match(/\.ogv/)) {
				source.url = 'video/ogg';
			} else {
				source.url = 'video/3gpp'
			}
		};
		function videoOptions(player) {
			let options = el.dataset.videoOptions.split(' ');
			options.forEach(function(e) {
				let c;
				if (e.includes('=')) {
					let cIndex = e.indexOf('=');
					c = e.substring(cIndex + 1);
					e = e.substring(0, cIndex);
				}
				ifDefined(c, () => c = c.substring(1, c.length-1));
				if (e.startsWith('!')) {
					player.removeAttribute(e.substring(1));
				} else if (c === 'false' || c === '0') {
					player.removeAttribute(e);
				} else if (c != null) {
					player[e] = c;
				} else {
					player[e] = true;
				}
			});
		};
		function fallbackSwap(fallbackimg) {
			let e = el.cloneNode(true);
			e.href = fallbackimg;
			if (currentItem === el) {
				fallbackToImage = true;
				content.removeChild(content.children[0]);
				content.prepend(sortContent(e));
				if (!fallbackToImage) {
					currentVideo = true;
					fallbackToImage =  false;
				}
				focusableElements();
				resizers();
			} else {
				let a = sortContent(e);
				if (a !== undefined) {
					focusableElements();
					resizers();
					return a;
				}
			}
		};
		if (href.match(/querySelector:/)) {
			const selected = document.querySelector(href.split(/querySelector:/)[1].trim());
			if (selected.nodeName === 'IMG' || selected.nodeName === 'FIGURE') {
				let image;
				if (selected.nodeName === 'FIGURE') {
					image = selected.querySelector('img').cloneNode();
					if (el.dataset.caption === undefined && selected.querySelector('figcaption') != null) {
						el.dataset.caption = selected.querySelector('figcaption').innerHTML;
					}
				} else {
					image = selected.cloneNode();
				}
				image.style = null;
				image.className = 'lightbox-image';
				ifDefined(el.dataset.imageSrcset, () => image.srcset = el.dataset.imageSrcset);
				if (el.dataset.imageAlt !== undefined) {
					image.alt = el.dataset.imageAlt;
				} else if (image.alt == null && internal != null && internal.alt != null) {
					image.alt = internal.alt;
				}
				const fallbackimg = el.dataset.fallbackImage;
				ifDefined(fallbackimg, () => {
					image.addEventListener('error', () => {
						if (fallbackimg.match(/\.(jpeg|jpg|gif|png|webp|apng|avif|svg)/)) {
							if (image.srcset != null) {
								if (lightboxOptions.fallbackswap) {
									if (selected.nodeName === 'IMG') {
										if (selected.srcset != null) {
											selected.srcset = selected.srcset.replace(image.currentSrc, fallbackimg);
										}
									} else {
										if (selected.querySelector('img').srcset != null) {
											selected.querySelector('img').srcset = selected.querySelector('img').srcset.replace(image.currentSrc, fallbackimg);
										}
									}
									if (el.dataset.imageSrcset != null) {
										el.dataset.imageSrcset = el.dataset.imageSrcset.replace(image.currentSrc, fallbackimg);
									}
								}
								image.srcset = image.srcset.replace(image.currentSrc, fallbackimg);
							} else {
								image.src = fallbackimg;
								if (lightboxOptions.fallbackswap) {
									if (selected.nodeName === 'IMG') {
										selected.src = fallbackimg;
									} else {
										selected.querySelector('img').src = fallbackimg;
									}
								}
							}
						} else {
							if (lightboxOptions.fallbackswap) {
								el.href = fallbackimg;
							}
							fallbackSwap(fallbackimg);
						}
					});
				});
				return image;
			} else if (selected.nodeName === 'PICTURE') {
				let image = selected.cloneNode(true);
				image.style = null;
				image.img = image.querySelector('img');
				image.img.className = 'lightbox-image';
				ifDefined(el.dataset.imageSrcset, () => image.img.srcset = el.dataset.imageSrcset);
				if (el.dataset.imageAlt !== undefined) {
					image.img.alt = el.dataset.imageAlt;
				} else if (image.img.alt == null && internal != null && internal.alt != null) {
					image.img.alt = internal.alt;
				}
				const fallbackimg = el.dataset.fallbackImage;
				ifDefined(fallbackimg, () => {
					image.img.addEventListener('error', () => {
						if (fallbackimg.match(/\.(jpeg|jpg|gif|png|webp|apng|avif|svg)/)) {
							let replaced = false;
							if (image.img.srcset != null) {
								if (image.img.srcset.match(image.img.currentSrc)) {
									replaced = true;
								}
								if (lightboxOptions.fallbackswap) {
									if (selected.querySelector('img').srcset != null) {
										selected.querySelector('img').srcset = selected.querySelector('img').srcset.replace(image.img.currentSrc, fallbackimg);
									}
									if (el.dataset.imageSrcset != null) {
										el.dataset.imageSrcset = el.dataset.imageSrcset.replace(image.img.currentSrc, fallbackimg);
									}
								}
								image.img.srcset = image.img.srcset.replace(image.img.currentSrc, fallbackimg);
							}
							image.querySelectorAll('source').forEach(function(e) {
								if (e.srcset.match(image.img.currentSrc)) {
									e.srcset = e.srcset.replace(image.img.currentSrc, fallbackimg);
									replaced = true;
								}
							});
							if (!replaced) {
								image.img.src = fallbackimg;
								if (lightboxOptions.fallbackswap) {
									selected.querySelector('img').src = fallbackimg;
								}
							}
							ifDefined(imageResizing, () => {
								imageResizing.unobserve(content);
								content.style.width = null;
							});
							image.img.addEventListener('load', () => {
								ifDefined(imageResizing, () => imageResizing.observe(content));
							});
						} else {
							if (lightboxOptions.fallbackswap) {
								el.href = fallbackimg;
							}
							fallbackSwap(fallbackimg);
						}
					});
				});
				return image;
			} else if (selected.nodeName === 'VIDEO') {
				video.player = selected.cloneNode(true);
				video.player.style = null;
				video.player.className = 'lightbox-video-player';
				video.player.tabIndex = 30005;
				video.player.setAttribute('aria-label', 'Video');
				if (lightboxOptions.video.autoplay) {
					video.player.autoplay = true;
				}
				if (!lightboxOptions.video.controls) {
					video.player.controls = false;
				}
				if (lightboxOptions.video.muted) {
					video.player.muted = true;
				}
				const fallbackimg = el.dataset.fallbackImage;
				if (fallbackimg !== undefined && videoRan !== el) {
					videoRan = el;
					video.player.querySelectorAll('source').forEach(function(e) {
						e.addEventListener('error', () => {
							if (fallbackimg.match(/\.(mp4|webm|ogv|3gp)/)) {
								selected.querySelectorAll('source').forEach(function(ee) {
									if (ee.src === e.src) {
										ee.src = fallbackimg;
										videoTypes(ee, fallbackimg);
									}
								})
							} else {
								el.href = fallbackimg;
							}
							if (currentItem === el) {
								if (content.querySelector('.lightbox-video-wrapper') != null) {
									content.removeChild(content.querySelector('.lightbox-video-wrapper'));
								}
								removeLoader();
								fallbackToImage = true;
								content.prepend(sortContent(el));
								if (fallbackToImage) {
									currentVideo = false;
									ifDefined(galleryItems, () => index = galleryItems.findIndex(item => item.value === currentItem));
									if (galleryItems[index].previous !== undefined && !currentVideo) {
										previousBox();
									}
									if (galleryItems[index].next !== undefined && !currentVideo) {
										content.querySelector('.lightbox-image').onclick = function() {galleryNavigation('next')};
									}
									focusableElements();
									resizers();
									fallbackToImage = false;
								}
							} else {
								let a = sortContent(el);
								if (a !== undefined) {
									focusableElements();
									resizers();
									return a;
								}
							}
						});
					});
				};
				ifDefined(el.dataset.videoOptions, () => videoOptions(video.player));
				if (el.dataset.videoTrack != null) {
					video.track = document.createElement('track');
					let track = el.dataset.videoTrack.split(',');
					track = track.map(s => s.trim());
					ifDefined(track[0], () => video.track.src = track[0]);
					ifDefined(track[1], () => video.track.kind = track[1]);
					ifDefined(track[2], () => video.track.label = track[2]);
					ifDefined(track[3], () => video.track.srclang = track[3]);
					video.player.appendChild(video.track);
				}
				video.wrapper = document.createElement('div');
				video.wrapper.className = 'lightbox-video-wrapper';
				video.wrapper.tabIndex = 30004;
				video.wrapper.setAttribute('aria-label', 'Video container');
				video.wrapper.appendChild(video.player);
				fallbackToImage = false;
				return video.wrapper;
			}
		} else if (href.match(/youtu\.be|(youtube|youtube-nocookie|vimeo|dailymotion)\.com/)) {
			video.player = document.createElement('iframe');
			video.player.setAttribute('title', video.title);
			video.player.setAttribute('allowfullscreen', '');
			video.player.setAttribute('frameborder', '0');
			video.player.className = 'lightbox-video-player';
			video.player.tabIndex = 30005;
			video.player.setAttribute('aria-label', 'Video');
			if (href.match(/youtube|youtu\.be/)) {
				video.id = href.split(/v\/|v=|youtu\.be\/|embed\//)[1].split(/[?&]/)[0];
				if (href.match('youtube-nocookie.com')) {
					video.url = 'youtube-nocookie.com/embed/';
				} else {
					video.url = 'youtube.com/embed/';
				}
				video.title = 'YouTube video player';
				video.originaloptions = href.split(/v\/|v=|youtu\.be\/|embed\//)[1].split(/[?&](.*)/)[1];
				if (video.originaloptions != null) {
					if (video.originaloptions.match('t=')) {
						video.originaloptions = video.originaloptions.replace('t=', 'amp;start=');
					}
					if (video.originaloptions.match('controls=')) {
						video.originaloptions = video.originaloptions.replace('controls=', 'amp;controls=');
					}
					video.originaloptions = video.originaloptions + '&';
				}
				if (lightboxOptions.video.autoplay) {
					video.originaloptions = video.originaloptions + 'autoplay=1&';
				}
				if (!lightboxOptions.video.controls) {
					video.originaloptions = video.originaloptions + 'controls=0&';
				}
				if (lightboxOptions.video.muted) {
					video.originaloptions = video.originaloptions + 'mute=1&';
				}
				video.options = '?' + video.originaloptions + 'rel=0';
				video.player.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; web-share');
			} else if (href.match('vimeo')) {
				video.id = href.split(/video\/|https:\/\/vimeo\.com\//)[1].split(/[?&]/)[0];
				video.url = 'player.vimeo.com/video/';
				video.title = 'Vimeo video player';
				video.originaloptions = href.split(/video\/|https:\/\/vimeo\.com\//)[1].split(/[?&](.*)/)[1];
				if (video.originaloptions != null) {
					video.originaloptions = video.originaloptions + '&';
				}
				if (lightboxOptions.video.autoplay) {
					video.originaloptions = video.originaloptions + 'autoplay=1&';
				}
				if (!lightboxOptions.video.controls) {
					video.originaloptions = video.originaloptions + 'controls=0&';
				}
				if (lightboxOptions.video.muted) {
					video.originaloptions = video.originaloptions + 'muted=1&';
				}
				video.options = '?' + video.originaloptions + 'title=1&byline=1&portrait=0';
				video.player.setAttribute('allow', 'autoplay; fullscreen');
			} else if (href.match('dailymotion')) {
				video.id = href.split(/video\//)[1].split(/[?&]/)[0];
				video.url = 'dailymotion.com/embed/video/';
				video.title = 'Dailymotion Video Player';
				video.originaloptions = href.split(/video\//)[1].split(/[?&](.*)/)[1];
				if (video.originaloptions != null) {
					video.originaloptions = '&' + video.originaloptions;
				}
				if (lightboxOptions.video.autoplay) {
					video.originaloptions = video.originaloptions + '&autoplay=1';
					video.player.setAttribute('allow', 'autoplay');
				}
				if (!lightboxOptions.video.controls) {
					video.originaloptions = video.originaloptions + '&controls=0';
				}
				if (lightboxOptions.video.muted) {
					video.originaloptions = video.originaloptions + '&muted=1';
				}
				video.options = '?' + 'queue-autoplay-next=false' + video.originaloptions;
			}
			video.player.src = 'https://' + video.url + video.id + video.options;
			video.wrapper = document.createElement('div');
			video.wrapper.className = 'lightbox-video-wrapper';
			video.wrapper.tabIndex = 30004;
			video.wrapper.setAttribute('aria-label', 'Video container');
			video.wrapper.appendChild(video.player);
			fallbackToImage = false;
			return video.wrapper;
		} else if (href.match(/\.(mp4|webm|ogv|3gp)/)) {
			video.player = document.createElement('video');
			video.player.className = 'lightbox-video-player';
			video.player.tabIndex = 30005;
			video.player.setAttribute('aria-label', 'Video');
			video.player.innerHTML = 'Your browser does not support the video tag.';
			if (lightboxOptions.video.autoplay) {
				video.player.autoplay = true;
			}
			if (lightboxOptions.video.controls) {
				video.player.controls = true;
			}
			if (lightboxOptions.video.muted) {
				video.player.muted = true;
			}
			ifDefined(el.dataset.videoOptions, () => videoOptions(video.player));
			video.source = document.createElement('source');
			video.source.src = href;
			videoTypes(video.source, href);
			const fallbackimg = el.dataset.fallbackImage;
			if (fallbackimg !== undefined && videoRan !== el) {
				videoRan = el;
				video.source.addEventListener('error', () => {
					if (lightboxOptions.fallbackswap) {
						el.href = fallbackimg;
					}
					let e = el.cloneNode(true);
					e.href = fallbackimg;
					if (currentItem === el) {
						if (content.querySelector('.lightbox-video-wrapper') != null) {
							content.removeChild(content.querySelector('.lightbox-video-wrapper'));
						}
						removeLoader();
						fallbackToImage = true;
						content.prepend(sortContent(e));
						if (fallbackToImage) {
							currentVideo = false;
							ifDefined(galleryItems, () => index = galleryItems.findIndex(item => item.value === currentItem));
							if (galleryItems[index].previous !== undefined && !currentVideo) {
								previousBox();
							}
							if (galleryItems[index].next !== undefined && !currentVideo) {
								content.querySelector('.lightbox-image').onclick = function() {galleryNavigation('next')};
							}
							focusableElements();
							resizers();
							fallbackToImage = false;
						}
					} else {
						let a = sortContent(e);
						if (a !== undefined) {
							focusableElements();
							resizers();
							return a;
						}
					}
				});
			};
			if (el.dataset.videoTrack != null) {
				video.track = document.createElement('track');
				let track = el.dataset.videoTrack.split(',');
				track = track.map(s => s.trim());
				ifDefined(track[0], () => video.track.src = track[0]);
				ifDefined(track[1], () => video.track.kind = track[1]);
				ifDefined(track[2], () => video.track.label = track[2]);
				ifDefined(track[3], () => video.track.srclang = track[3]);
				video.player.prepend(video.track);
			}
			video.player.prepend(video.source);
			video.wrapper = document.createElement('div');
			video.wrapper.className = 'lightbox-video-wrapper';
			video.wrapper.tabIndex = 30004;
			video.wrapper.setAttribute('aria-label', 'Video container');
			video.wrapper.appendChild(video.player);
			fallbackToImage = false;
			return video.wrapper;
		} else if (href.match(/\.(jpeg|jpg|gif|png|webp|apng|avif|svg)/) || internal != null) {
			const image = document.createElement('img');
			image.className = 'lightbox-image';
			if (href.match(/\.(jpeg|jpg|gif|png|webp|apng|avif|svg)/)) {
				image.src = href;
			} else {
				image.src = internal.currentSrc;
			}
			const fallbackimg = el.dataset.fallbackImage;
			ifDefined(el.dataset.imageSrcset, () => image.srcset = el.dataset.imageSrcset);
			if (el.dataset.imageAlt !== undefined) {
				image.alt = el.dataset.imageAlt;
			} else if (internal != null && internal.alt != null) {
				image.alt = internal.alt;
			}
			ifDefined(fallbackimg, () => {
				image.addEventListener('error', () => {
					if (fallbackimg.match(/\.(jpeg|jpg|gif|png|webp|apng|avif|svg)/)) {
						if (image.srcset != null) {
							if (lightboxOptions.fallbackswap) {
								el.dataset.imageSrcset = el.dataset.imageSrcset.replace(image.currentSrc, fallbackimg);
							}
							image.srcset = image.srcset.replace(image.currentSrc, fallbackimg);
						} else {
							image.src = fallbackimg;
							if (lightboxOptions.fallbackswap) {
								el.href = fallbackimg;
							}
						}
					} else {
						if (lightboxOptions.fallbackswap) {
							el.href = fallbackimg;
						}
						fallbackSwap(fallbackimg);
					}
				});
			});
			return image;
		} else {
			throw new LightboxError(`Could not initialize lightbox: 'href' property does not link to compatible content and no <img> element inside`)
		}
	};

	function getCaption(el) {
		caption = document.createElement('div');
		caption.className = 'lightbox-caption';
		let captiontext = document.createElement('span');
		captiontext.innerHTML = el.dataset.caption;
		caption.appendChild(captiontext);
		return caption;
	};

	function getGalleryItems(el) {
		let allitems;
		if (lightboxOptions.all !== 'gallery') {
			let gallery = el.dataset.lightbox;
			allitems = Array.from(document.querySelectorAll('[data-lightbox="' + gallery + '"]'));
		} else {
			allitems = Array.from(document.querySelectorAll('[data-lightbox]'));
		}
		const items = [];
		for (const e of allitems) {
			const item = { value: e };
			const prevItem = items[items.length - 1];
			ifDefined(prevItem, () => {
				item.previous = prevItem;
				prevItem.next = item;
			});
			if (allitems.indexOf(e) === allitems.length - 1) {
				if (lightboxOptions.carousel) {
					item.next = items[0];
					items[0].previous = item;
				}
			}
			items.push(item);
		}
		return items;
	};

	function previousBox() {
		prevBox = document.createElement('div');
		prevBox.className = 'lightbox-prevbox';
		prevBox.setAttribute('aria-label', 'Previous image');
		prevBox.onclick = function(event) {event.stopPropagation(); galleryNavigation('previous')};
		if (content.querySelector('picture') != null) {
			content.querySelector('picture').after(prevBox);
		} else {
			content.querySelector('.lightbox-image').after(prevBox);
		}
	}

	function buildPrevNext(el) {
		index = galleryItems.findIndex(item => item.value === el);
		ifDefined(galleryItems[index].previous, () => {
			galleryItems[index].previous.value.classList.add('previous-lightbox-item');
			let previousElement = galleryItems[index].previous.value;
			previousImage = sortContent(previousElement);
			if (previousImage.nodeName === 'picture') {
				previousImage = previousImage.querySelector('img');
			}
			let previousVideo = false;
			if (previousImage.classList.contains('lightbox-video-wrapper')) {
				previousVideo = true;
				ifDefined(btnNav, () => btnNav['previous'].classList.add('lightbox-btn-video'));
			}

			if (lightboxOptions.sideimages && !previousVideo) {
				previousContent = document.createElement('div');
				previousContent.className = 'lightbox-content lightbox-nav';
				previousContent.setAttribute('aria-label', 'Previous image');
				previousContent.tabIndex = 30003;
				previousContent.onclick = function() {galleryNavigation('previous')};
				previousContent.onkeydown = function(event) {if (event.key === 'Enter') {galleryNavigation('previous')}};
				previousContent.appendChild(previousImage);

				previousContainer = document.createElement('div');
				previousContainer.className = 'previous-lightbox-container';
				previousContainer.appendChild(previousContent);

				gallerySides.appendChild(previousContainer);
			}
		});

		ifDefined(galleryItems[index].next, () => {
			galleryItems[index].next.value.classList.add('next-lightbox-item');
			let nextElement = galleryItems[index].next.value;
			nextImage = sortContent(nextElement);
			if (nextImage.nodeName === 'picture') {
				nextImage = nextImage.querySelector('img');
			}
			let nextVideo = false;
			if (nextImage.classList.contains('lightbox-video-wrapper')) {
				nextVideo = true;
				ifDefined(btnNav, () => btnNav['next'].classList.add('lightbox-btn-video'));
			}

			if (lightboxOptions.sideimages && !nextVideo) {
				nextContent = document.createElement('div');
				nextContent.className = 'lightbox-content lightbox-nav';
				nextContent.setAttribute('aria-label', 'Next image');
				nextContent.tabIndex = 30001;
				nextContent.onclick = function() {galleryNavigation('next')};
				nextContent.onkeydown = function(event) {if (event.key === 'Enter') {galleryNavigation('next')}};
				nextContent.appendChild(nextImage);

				nextContainer = document.createElement('div');
				nextContainer.className = 'next-lightbox-container';
				nextContainer.appendChild(nextContent);

				gallerySides.appendChild(nextContainer);
			}
		});
	};

	function buildLightbox(el) {
		el.blur();
		currentItem = el;
		el.classList.add('current-lightbox-item');

		if (lightboxOptions.buttons.close) {
			btnClose = document.createElement('button');
			btnClose.type = 'button';
			btnClose.className = 'lightbox-btn lightbox-btn-close';
			btnClose.setAttribute('aria-label', 'Close lightbox');
			btnClose.tabIndex = 30002;
			if (lightboxOptions.animated) {
				btnClose.style.animation = lightboxOptions.animation.fadeIn;
				btnClose.addEventListener('animationend', () => btnClose.style.animation = '');
			}
		}

		content = document.createElement('div');
		content.className = 'lightbox-content';
		currentImage = sortContent(el);
		content.appendChild(currentImage);
		content.classList.add('lightbox-no-sides');
		content.classList.add('lightbox-no-buttons');
		if (currentImage.classList.contains('lightbox-video-wrapper')) {
			currentVideo = true;
			if (content.querySelector('.lightbox-loader') == null) {
				addLoader();
			}
		}
		if (lightboxOptions.buttons.close && lightboxOptions.buttons.attached) {
			btnClose.classList.add('lightbox-btn-attached');
			content.appendChild(btnClose);
		}
		if (lightboxOptions.animated) {
			currentImage.style.animation = [lightboxOptions.animation.scaleIn, lightboxOptions.animation.fadeIn];
		}

		container = document.createElement('div');
		container.className = 'lightbox-container';
		if (lightboxOptions.animated) {
			container.style.animation = lightboxOptions.animation.fadeIn;
		}
		container.appendChild(content);
		ifDefined(el.dataset.caption, () => {
			container.appendChild(getCaption(el));
			container.classList.add('lightbox-captioned');
		});

		box = document.createElement('div');
		box.className = 'lightbox';
		if (lightboxOptions.animated) {
			box.style.animation = lightboxOptions.animation.fadeIn;
		}
		box.appendChild(container);

		if ((el.dataset.lightbox && (lightboxOptions.all !== 'single') || lightboxOptions.all === 'gallery')) {
			galleryItems = getGalleryItems(el);
			index = galleryItems.findIndex(item => item.value === el);
			if (galleryItems.length !== 1) {
				if (lightboxOptions.sideimages) {
					content.classList.remove('lightbox-no-sides');
					gallerySides = document.createElement('div');
					gallerySides.className = 'gallery-sides';
					if (lightboxOptions.animated) {
						gallerySides.style.animation = lightboxOptions.animation.fadeIn;
					}
					box.prepend(gallerySides);
				}
				imgarray = Array(currentImage);
				container.classList.add('lightbox-gallery');
				ifDefined(galleryItems[index].next, () => {
					content.classList.add('lightbox-nav');
					if (!currentVideo) {
						content.querySelector('.lightbox-image').onclick = function() {galleryNavigation('next')};
					}
				});
				if (lightboxOptions.buttons.nav) {
					btnNav = {previous: '', next: ''};
				}
				for (let key in btnNav) {
					if (btnNav.hasOwnProperty(key)) {
						btnNav[key] = document.createElement('button');
						btnNav[key].type = 'button';
						btnNav[key].className = 'lightbox-btn lightbox-btn-' + key;
						btnNav[key].setAttribute('aria-label', key.charAt(0).toUpperCase() + key.slice(1) + ' image');
						if (key === 'previous') {
							btnNav[key].tabIndex = 30003;
						} else {
							btnNav[key].tabIndex = 30001;
						}
						btnNav[key].disabled = galleryItems[index][key] === undefined ? true : false;
						if (lightboxOptions.animated) {
							btnNav[key].style.animation = lightboxOptions.animation.fadeIn;
							btnNav[key].addEventListener('animationend', () => btnNav[key].style.animation = '');
						}
						if (lightboxOptions.buttons.attached) {
							btnNav[key].classList.add('lightbox-btn-attached');
						} else {
							content.classList.remove('lightbox-no-buttons');
						}
						content.appendChild(btnNav[key]);
					}
				}

				buildPrevNext(el);
				if (galleryItems[index].previous !== undefined && !currentVideo) {
					previousBox();
				}
				ifDefined(galleryItems[index].previous, () => imgarray.unshift(previousImage));
				ifDefined(galleryItems[index].next, () => imgarray.push(nextImage));
				if (lightboxOptions.animated) {
					ifDefined(previousContent, () => previousContent.style.animation = [lightboxOptions.animation.scaleIn, lightboxOptions.animation.fadeIn]);
					ifDefined(nextContent, () => nextContent.style.animation = [lightboxOptions.animation.scaleIn, lightboxOptions.animation.fadeIn]);
				}
			}
		}

		if (lightboxOptions.buttons.close && !lightboxOptions.buttons.attached) {
			box.appendChild(btnClose);
		}
		body.appendChild(box);
		toggleScroll();
		resizers();
		focusableElements();

		['click', 'keydown'].forEach(function(eventType) {
			body.addEventListener(eventType, inputEvent);
		});
		body.addEventListener('keydown', tabbing);
	};

	function galleryNavigation(position) {
		index = galleryItems.findIndex(item => item.value === currentItem);
		ifDefined(galleryItems[index][position], () => {
			const item = galleryItems[index][position].value;
			const itemindex = galleryItems.findIndex(item => item.value === galleryItems[index][position].value);
			currentItem.classList.remove('current-lightbox-item');
			ifDefined(galleryItems[index].next, () => galleryItems[index].next.value.classList.remove('next-lightbox-item'));
			ifDefined(galleryItems[index].previous, () => galleryItems[index].previous.value.classList.remove('previous-lightbox-item'));

			currentItem = item;
			imgarray = Array(sortContent(currentItem));
			
			item.classList.add('current-lightbox-item');
			ifDefined(galleryItems[itemindex].next, () => {
				galleryItems[itemindex].next.value.classList.add('next-lightbox-item');
				imgarray.push(nextImage);
			});
			ifDefined(galleryItems[itemindex].previous, () => {
				galleryItems[itemindex].previous.value.classList.add('previous-lightbox-item');
				imgarray.unshift(previousImage);
			});

			for (let key in btnNav) {
				if (btnNav.hasOwnProperty(key)) {
					btnNav[key].disabled = galleryItems[itemindex][key] === undefined ? true : false;
				}
			}

			if (position === 'next') {
				if (imgarray[1].classList.contains('lightbox-video-wrapper')) {
					currentVideo = true;
				} else {
					currentVideo = false;
				}
			}
			if (position === 'previous') {
				if (imgarray[imgarray.length-2].classList.contains('lightbox-video-wrapper')) {
					currentVideo = true;
				} else {
					currentVideo = false;
				}
			}

			function replace() {
				removeLoader();
				let closeTab = focusable.find((e) => e.tabIndex === 30006);
				ifDefined(closeTab, () => {
					if (closeTab.classList.contains('lightbox-btn-close')) {
						btnClose.tabIndex = 30002;
					}
				});
				ifDefined(imageResizing, () => {
					imageResizing.unobserve(content);
					imageResizing = undefined;
					content.style.width = null;
				});
				let picture = content.querySelector('picture');
				if (picture != null) {
					ifDefined(pictureResizing, () => {
						pictureResizing.unobserve(picture);
						pictureResizing = undefined;
						picture.style.width = null;
						picture.querySelector('img').removeEventListener('load', pictureReload);
					});
					content.prepend(content.querySelector('img'));
					content.removeChild(content.querySelector('picture'));
				}
				if (lightboxOptions.sideimages) {
					gallerySides.innerHTML = '';
				}
				if (content.querySelector('.lightbox-prevbox') != null) {
					content.removeChild(prevBox);
				}
				if (btnNav !== undefined && btnNav['previous'].classList.contains('lightbox-btn-video')) {
					btnNav['previous'].classList.remove('lightbox-btn-video');
				}
				if (btnNav !== undefined && btnNav['next'].classList.contains('lightbox-btn-video')) {
					btnNav['next'].classList.remove('lightbox-btn-video');
				}
				buildPrevNext(currentItem);

				if (position === 'next') {
					content.replaceChild(imgarray[1], content.children[0]);
				}
				if (position === 'previous') {
					content.replaceChild(imgarray[imgarray.length-2], content.children[0]);
				}

				if (currentVideo && content.querySelector('.lightbox-loader') == null) {
					addLoader();
				}

				if (galleryItems[index].previous !== undefined && !currentVideo) {
					previousBox();
				}

				if (galleryItems[itemindex].next === undefined) {
					content.classList.remove('lightbox-nav');
				} else {
					content.classList.add('lightbox-nav');
					if (!currentVideo) {
						content.querySelector('.lightbox-image').onclick = function() {galleryNavigation('next')};
					}
				}

				if (item.dataset.caption !== undefined) {
					if (container.contains(caption)) {
						caption.replaceWith(getCaption(item));
					} else {
						container.appendChild(getCaption(item));
					}
					container.classList.add('lightbox-captioned');
					if (lightboxOptions.animated) {
						container.querySelector('.lightbox-caption').style.animation = lightboxOptions.animation.fadeIn;
					}
				} else {
					if (container.contains(caption)) {
						container.removeChild(caption);
					}
					container.classList.remove('lightbox-captioned');
				}

				removeLoader();
				resizers();
				focusableElements();
				if (wasTabbed === 0) {
					document.activeElement.blur();
				} else {
					let nextTarget = focusable.find(e => e.getAttribute('aria-label').includes(position.charAt(0).toUpperCase()));
					ifDefined(nextTarget, () => nextTarget.focus());
				}
			};

			if (lightboxOptions.animated) {
				if (content.querySelector('.lightbox-video-wrapper') != null) {
					selector = '.lightbox-video-wrapper';
				} else {
					selector = '.lightbox-image';
				}
				content.querySelector(selector).addEventListener('animationend', function() {
					replace();
					if (content.querySelector('.lightbox-video-wrapper') != null) {
						selector = '.lightbox-video-wrapper';
					} else {
						selector = '.lightbox-image';
					}
					content.querySelector(selector).style.animation = lightboxOptions.animation.fadeIn;
				});
				content.querySelector(selector).style.animation = lightboxOptions.animation.fadeOut;
				if (container.classList.contains('lightbox-captioned')) {
					container.querySelector('.lightbox-caption').style.animation = lightboxOptions.animation.fadeOut;
				}
				if (lightboxOptions.sideimages) {
					gallerySides.addEventListener('animationend', function() {
						if (event.animationName === 'fadeOut') {
							ifDefined(gallerySides, () => gallerySides.removeAttribute('style'));
							ifDefined(previousContent, () => previousContent.removeAttribute('style'));
							ifDefined(nextContent, () => nextContent.removeAttribute('style'));
							ifDefined(gallerySides, () => gallerySides.style.animation = lightboxOptions.animation.fadeIn);
						}
					});
					gallerySides.style.animation = lightboxOptions.animation.fadeOut;
				}
			} else {
				replace();
			}
		});
	};

	function focusableElements() {
		focusable = [];
		focusable.push(Array.from(box.querySelectorAll('[tabIndex="30004"]')), Array.from(box.querySelectorAll('[tabIndex="30005"]')), Array.from(box.querySelectorAll('[tabIndex="30006"]')), Array.from(box.querySelectorAll('[tabIndex="30001"]')), Array.from(box.querySelectorAll('[tabIndex="30002"]')), Array.from(box.querySelectorAll('[tabIndex="30003"]')));
		focusable = focusable.flat();
		focusable = focusable.filter(function(el) {
			let style = window.getComputedStyle(el);
			return (style.display !== 'none' && !el.disabled && el.nodeName !== 'IFRAME');
		});
		if (lightboxOptions.sideimages && btnNav !== undefined) {
			if ((focusable.indexOf(btnNav.previous) !== -1) || (focusable.indexOf(btnNav.next) !== -1)) {
				focusable = focusable.filter(function(el) {
					if (el.classList.contains('next-lightbox-container') && focusable.includes(btnNav['next'])) {
						return false;
					} else if (el.classList.contains('previous-lightbox-container') && focusable.includes(btnNav['previous'])) {
						return false;
					} else {
						return true;
					}
				});
			}
		}
		let a = focusable.findIndex(e => e.getAttribute('aria-label') === 'Next image');
		let b = focusable.findIndex(e => e.classList.contains('lightbox-btn-close'));
		if (a !== -1 && b !== -1 && a > b) {
			focusable[a] = focusable.splice(b, 1, focusable[a])[0];
		}
		if (currentVideo) {
			if (ifDefined(focusable[2], () => focusable[1].nodeName === 'VIDEO')) {
				focusable[2].tabIndex = 30006;
			} else {
				ifDefined(focusable[1], () => focusable[1].tabIndex = 30006);
			}
		}
	};

	function tabbing(event) {
		if (body.contains(box)) {
			if (event.key === 'Tab') {
				if (!document.activeElement.classList.contains('lightbox-video-player')) {
					if (event.shiftKey) {
						if (focusable.length === 0) {
							event.preventDefault();
						} else if (focusable.find((e) => e.tabIndex === 30006) == true && ifDefined(focusable.find((e) => e.tabIndex < 30004), () => document.activeElement.tabIndex === focusable.find((e) => e.tabIndex < 30004).tabIndex)) {
							event.preventDefault();
							focusable[focusable.indexOf(document.activeElement) - 1].focus();
						} else if (focusable.indexOf(document.activeElement) === 0) {
							event.preventDefault();
							focusable[focusable.length - 1].focus();
						} else if (focusable.indexOf(document.activeElement) !== -1 && document.activeElement.tabIndex !== 30006) {
							event.preventDefault();
							focusable[focusable.indexOf(document.activeElement) - 1].focus();
						} else if (!box.contains(document.activeElement)) {
							event.preventDefault();
							focusable[focusable.length -1].focus();
						}
					} else {
						if (focusable.length === 0) {
							event.preventDefault();
						} else if (document.activeElement.tabIndex === 30006) {
							event.preventDefault();
							if (focusable.indexOf(document.activeElement) !== (focusable.length - 1)) {
								focusable[focusable.indexOf(document.activeElement) + 1].focus();
							} else {
								focusable[0].focus();
							}
						} else if (focusable.indexOf(document.activeElement) === (focusable.length - 1)) {
							if (!currentVideo) {
								event.preventDefault();
							}
							focusable[0].focus();
						} else if (document.activeElement.classList.contains('lightbox-video-wrapper') && ifDefined(focusable[1], () => focusable[1].nodeName === 'VIDEO')) {
							focusable[1].focus();
						} else if (!box.contains(document.activeElement)) {
							event.preventDefault();
							if (currentVideo && ifDefined(focusable[1], () => focusable[1].nodeName === 'VIDEO') && focusable[2] !== undefined) {
								focusable[2].focus();
							} else if (currentVideo && focusable[1] !== undefined) {
								focusable[1].focus();
							} else {
								focusable[0].focus();
							}
						}
					}
					wasTabbed = 1;
				}
			}
		}
	};

	function touchstart(event) {
		singleTouch += 1;
		touchstartX = event.changedTouches[0].screenX;
		touchstartY = event.changedTouches[0].screenY;
	};

	function touchend(event) {
		if (singleTouch === 1) {
			touchendX = event.changedTouches[0].screenX;
			touchendY = event.changedTouches[0].screenY;
			handleGesture();
		}
		singleTouch = 0;
	};

	function handleGesture() {
		if (Math.abs(touchendX - touchstartX) > Math.abs(touchendY - touchstartY) && Math.abs(touchendX - touchstartX) > touchSensitivity) {
			if (touchendX < touchstartX) {
				box.removeEventListener('touchstart', touchstart);
				box.removeEventListener('touchend', touchend);
				galleryNavigation('next');
				box.addEventListener('touchend', touchend);
				box.addEventListener('touchstart', touchstart);
			}
			if (touchendX > touchstartX) {
				box.removeEventListener('touchstart', touchstart);
				box.removeEventListener('touchend', touchend);
				galleryNavigation('previous');
				box.addEventListener('touchend', touchend);
				box.addEventListener('touchstart', touchstart);
			}
		}
	};

	function inputEvent(event) {
		if (body.contains(box)) {
			const target = event.target, key = event.key, type = event.type;
			if ((type === 'click' && [box, btnClose].indexOf(target) !== -1) || key === 'Escape') {
				closeLightbox();
			}
			if (ifDefined(container, () => container.classList.contains('lightbox-gallery'))) {
				if (ifDefined(btnNav, () => type === 'click' && target === btnNav.next) || key === 'ArrowRight') {
					if (!(key === 'ArrowRight' && document.activeElement.classList.contains('lightbox-video-player'))) {
						if (type === 'click' && event.detail === 0) {
							wasTabbed = 1;
						} else {
							wasTabbed = 0;
						}
						galleryNavigation('next');
					}
				}
				if (ifDefined(btnNav, () => type === 'click' && target === btnNav.previous) || key === 'ArrowLeft') {
					if (!(key === 'ArrowLeft' && document.activeElement.classList.contains('lightbox-video-player'))) {
						if (type === 'click' && event.detail === 0) {
							wasTabbed = 1;
						} else {
							wasTabbed = 0;
						}
						galleryNavigation('previous');
					}
				}
				box.addEventListener('touchend', touchend);
				box.addEventListener('touchstart', touchstart);
			}
		}
	};

	function closeLightbox() {
		function removal() {
			['click', 'keydown'].forEach(function(eventType) {
				body.removeEventListener(eventType, inputEvent);
			});
			body.removeEventListener('keydown', tabbing);
			ifDefined(imageResizing, () => imageResizing.unobserve(content));
			imageResizing = undefined;
			if (pictureResizing !== undefined && content.querySelector('picture') != null) {
				pictureResizing.unobserve(content.querySelector('picture'));
				pictureResizing = undefined;
			}
			if (ifDefined(box, () => body.contains(box))) {
				body.removeChild(box);
				caption = undefined;
				document.documentElement.style.setProperty('--lightbox-caption-height', 0 + 'px');
				currentTrigger.focus();
				currentItem.classList.remove('current-lightbox-item');
				toggleScroll();
			}
			for (const key in video) {
				delete video[key];
			};
			btnClose = btnNav = currentItem = box = container = nextContainer = previousContainer = content = nextContent = previousContent = currentImage = nextImage = previousImage = selector = index = galleryItems = gallerySides = currentVideo = videoRan = fallbackToImage = imageResizing = pictureResizing = prevBox = imgarray = caption = currentTrigger = touchstartX = touchstartY = touchendX = touchendY = focusable = undefined;
			singleTouch = 0
			wasTabbed = 0;
		};
		ifDefined(box, () => {
			if (lightboxOptions.animated) {
				box.addEventListener('animationend', function() {
					if (event.animationName === 'fadeOut') {
						removal();
					}
				});
				if (content.contains(prevBox)) {
					content.removeChild(prevBox);
				}
				let scalingOut = [lightboxOptions.animation.scaleOut, lightboxOptions.animation.fadeOut];
				currentImage.style.animation = scalingOut;
				ifDefined(caption, () => caption.style.animation = scalingOut);
				ifDefined(previousContent, () => previousContent.style.animation = scalingOut);
				ifDefined(nextContent, () => nextContent.style.animation = scalingOut);
				/* ifDefined(gallerySides, () => gallerySides.style.animation = scalingOut); */ // makes the side images scale out to the center of the screen instead of individually
				box.style.animation = lightboxOptions.animation.fadeOut;
			} else {
				removal();
			}
		});
	};

	function startLightbox(el) {
		closeLightbox();
		currentTrigger = el;
		lightboxOptions = JSON.parse(JSON.stringify(defaultOptions));
		let options;
		let optionsElement = document.querySelector('[data-lightbox="' + el.dataset.lightbox + '"][data-lightbox-options]');
		if (el.dataset.lightbox == null) {
			options = el.dataset.lightboxOptions;
		} else if (optionsElement != null) {
			options = optionsElement.dataset.lightboxOptions;
		}
		ifDefined(options, () => {
			options = options.split(',');
			options.forEach(function(e) {
				e = e.trim();
				let b, c, val;
				if (e.includes('=')) {
					let cIndex = e.indexOf('=');
					c = e.substring(cIndex + 1).trim();
					e = e.substring(0, cIndex).trim();
				}
				if (c != null && (c.startsWith('"') || c.startsWith("'"))) {
					c = c.substring(1, c.length-1);
				}
				if (e.includes('.')) {
					b = e.split('.')[1];
					e = e.split('.')[0];
				}
				if (e.startsWith('!')) {
					e = e.substring(1);
					val = false;
				} else if (c === 'false' || c === '0') {
					val = false;
				} else if (c === 'null') {
					val = null;
				} else if (c != null && c !== 'true' && c !== '1') {
					val = c;
				} else {
					val = true;
				}
				if (lightboxOptions.hasOwnProperty(e)) {
					if (b != null) {
						if (lightboxOptions[e].hasOwnProperty(b)) {
							lightboxOptions[e][b] = val;
						} else {
							throw new LightboxError(`Unexpected property "${e}.${b}" in 'data-lightbox-options' attribute`)
						}
					} else {
						lightboxOptions[e] = val;
					}
				} else {
					throw new LightboxError(`Unexpected property "${e}" in 'data-lightbox-options' attribute`);
				}
			});
		});
		validateOptions();
		buildLightbox(el);
	};

	window.startLightbox = startLightbox;
	window.closeLightbox = closeLightbox;

	Array.prototype.forEach.call(trigger, function(el) {
		el.addEventListener('click', function(event) {
			event.preventDefault();
			startLightbox(el);
		});
	});
}());
