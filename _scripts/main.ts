import { build } from './build';

async function main() {
    const arg = process.argv[2];
    console.log(`Running command: ${arg}`);
    switch (arg) {
        case 'build':
            {
                await build();
            }
            break;
    }
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
