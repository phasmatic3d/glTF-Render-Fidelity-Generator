// Generates the Filament IBL (ktx/<name>/<name>_ibl.ktx and _skybox.ktx) for
// an environment map with cmgen, if necessary. cmgen is downloaded by
// scripts/fetch-filament.js as part of `npm run build`.

import {spawnSync} from 'child_process';
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import jpeg from 'jpeg-js';
import {basename, dirname, extname, join, resolve} from 'path';
import {PNG} from 'pngjs';
import {fileURLToPath} from 'url';
import {parseArgs} from 'util';

const showUsage = () => console.log(`Generates IBL with cmgen if necessary.

Usage:

  node prepare-ibl.js -i <ibl input file> [-vI]

Note: script caches generated IBLs across multiple invocations.
To force regeneration of the IBL, add the -I flag (be aware that
this will take longer).`);

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const IBL_DIR = join(SCRIPT_DIR, 'ktx');
const CMGEN_BIN =
    join(SCRIPT_DIR, process.platform === 'win32' ? 'cmgen.exe' : 'cmgen');

let options;
try {
  ({values: options} = parseArgs({
    options: {
      'input': {type: 'string', short: 'i'},
      'regenerate': {type: 'boolean', short: 'I', default: false},
      'verbose': {type: 'boolean', short: 'v', default: false},
      'help': {type: 'boolean', short: '?', default: false},
    }
  }));
} catch (error) {
  console.error(error.message);
  showUsage();
  process.exit(1);
}

if (options.help) {
  showUsage();
  process.exit(0);
}

// Argument defaults:
const iblInputFile = options.input || process.env.LIGHTING;

if (!iblInputFile) {
  showUsage();
  process.exit(1);
}

if (!existsSync(CMGEN_BIN)) {
  console.error(
      `cmgen not found at ${CMGEN_BIN}. Run \`npm run fetch:filament\`.`);
  process.exit(1);
}

const iblExtension = extname(iblInputFile).slice(1).toLowerCase();
const iblBasename = basename(iblInputFile, extname(iblInputFile));
const iblOutputPath = join(IBL_DIR, iblBasename);
const iblFile = join(iblOutputPath, `${iblBasename}_ibl.ktx`);

if (!options.regenerate && existsSync(iblFile)) {
  // Nothing to do...
  process.exit(0);
}

mkdirSync(IBL_DIR, {recursive: true});

let cmgenInputFile = resolve(iblInputFile);

// cmgen can't decode JPEGs, so convert them to PNG first. jpeg-js decodes to
// RGBA but cmgen only accepts 3 channels, so the PNG is written as RGB.
if (iblExtension === 'jpg' || iblExtension === 'jpeg') {
  const {width, height, data} =
      jpeg.decode(readFileSync(cmgenInputFile), {maxMemoryUsageInMB: 2048});
  const png = new PNG({width, height});
  png.data = Buffer.from(data);
  cmgenInputFile = join(IBL_DIR, `${iblBasename}.png`);
  writeFileSync(cmgenInputFile, PNG.sync.write(png, {colorType: 2}));
}

const cmgenArgs = ['--format=ktx', '-x', iblOutputPath, cmgenInputFile];

if (options.verbose) {
  console.log(CMGEN_BIN, ...cmgenArgs);
}

rmSync(iblOutputPath, {recursive: true, force: true});

const result = spawnSync(CMGEN_BIN, cmgenArgs, {stdio: 'inherit'});

if (result.error != null || result.status !== 0) {
  if (result.error != null) {
    console.error(result.error);
  }
  // Leave no partial IBL behind so the next run retries.
  rmSync(iblOutputPath, {recursive: true, force: true});
  process.exit(1);
}
