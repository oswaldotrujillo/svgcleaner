'use strict';

const puppeteer = require('puppeteer');
const path = require('path');

var argv = process.argv.slice(2);
var svg_path = path.resolve(argv[0]);
var png_path = argv[1];

(async() => {

const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.goto("file://" + svg_path);

var svg_file_size = await page.evaluate(() => {
    var svg = document.getElementsByTagName("svg")[0];
    return [
        svg.getAttribute("width"),
        svg.getAttribute("height")
    ]
});

var is_dynamic =    (svg_file_size[0] == "100%" && svg_file_size[1] == "100%")
                 || (svg_file_size[0] == null && svg_file_size[1] == null)

if (is_dynamic) {
    // TODO: scale to width
//     var svg_width = 0;
//     if (argv[2] == undefined) {
//         console.log("Error: width argument must be set")
//         process.exit()
//     } else {
//         svg_width = parseInt(argv[2])
//     }

    var svg_view_box = await page.evaluate(() => {
        var svg = document.querySelector('svg')
        var box = svg.getAttribute('viewBox');
        if (box == null) {
            return null
        }
        return box.split(/\s+|,/)
    });

    if (svg_view_box == null) {
        console.error("Error: no viewBox")
        process.exit(1);
    }

    await page.setViewport({
        width: parseInt(svg_view_box[2]),
        height: parseInt(svg_view_box[3])
    });

//     await page.setViewport({
//         width: svg_width,
//         height: svg_width
//     });

//     const scale = svg_width / svg_view_box[2]

//     const h = Math.round(svg_view_box[3] * scale)
//     const y = Math.round((svg_width - h) / 2)

//     console.log(scale, y, h)

    await page.screenshot({
        path: png_path,
//         clip: { x: 0, y: y, width: svg_width, height: h }
    });
} else {
    var svg_rect = await page.evaluate(() => {
        var root = document.rootElement;
        return [
            root.x.baseVal.value,
            root.y.baseVal.value,
            root.width.baseVal.value,
            root.height.baseVal.value
        ]
    });

    var svg_scale = 1
    if (argv[2] != undefined) {
        svg_scale = argv[2] / svg_rect[2]
    }

    await page.setViewport({
        width: 2000,
        height: 2000,
        deviceScaleFactor: svg_scale
    });

    await page.screenshot({
        path: png_path,
        clip: { x: svg_rect[0], y: svg_rect[1], width: svg_rect[2], height: svg_rect[3] }
    });
}

browser.close();

})();
