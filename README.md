# QRCode Generator

I was surprised to find out that internet is full of QR code generators that require you to pay to use that and some of them are tracking number of QR code scans. All of that infrastructure just to generate a QR code with some additional styling.

This motivated me to explore how QR code generation works and to implement it on my own. I wanted to make it open source and free to use for everyone, so I created this project. I decided to use WebGL to render the QR codes because it will allow for some extreme customization. My idea is to let you do what ever you want with the code, which is some cases my result in unusable codes, but that's up to you.

I hope you will find this project useful and fun to use. You can generate your QR codes here: https://qrcode.vajaga.com

## Development

To run the project locally, you will need BunJS or NodeJS 20+:

- Install dependencies: `bun install`
- Start the development server: `bun dev`
- Build the project: `bun run build`

The only production dependency is `cuid2`, everything else is written from scratch using available browser APIs.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
