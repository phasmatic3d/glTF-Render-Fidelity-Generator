// Configures and builds vk_gltf_renderer with CMake.
//
// Usage: npm run build:vk_gltf_renderer [-- --dlss] [-- --optix]
//
//   --dlss   build with NVIDIA DLSS support (USE_DLSS)
//   --optix  build with the OptiX denoiser (USE_OPTIX_DENOISER)
//

import {spawnSync} from 'child_process';
import {dirname, join} from 'path';
import {fileURLToPath} from 'url';
import {parseArgs} from 'util';

const SOURCE_DIR =
    join(dirname(fileURLToPath(import.meta.url)), '..', 'vk_gltf_renderer');

const {values: options} = parseArgs({
  options: {
    'dlss': {type: 'boolean', default: false},
    'optix': {type: 'boolean', default: false},
  }
});

const onOff = (enabled) => enabled ? 'ON' : 'OFF';
const BUILD_DIR = ['build']
                      .concat(options.dlss ? ['dlss'] : [])
                      .concat(options.optix ? ['optix'] : [])
                      .join('-');

const cmake = (args) => {
  console.log(`> cmake ${args.join(' ')}`);
  const result = spawnSync('cmake', args, {cwd: SOURCE_DIR, stdio: 'inherit'});
  if (result.error != null) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status != null ? result.status : 1);
  }
};

cmake([
  '-B', BUILD_DIR, '-S', '.',
  '-DCMAKE_BUILD_TYPE=Release',
  `-DUSE_DLSS=${onOff(options.dlss)}`,
  `-DUSE_OPTIX_DENOISER=${onOff(options.optix)}`,
]);

cmake(['--build', BUILD_DIR, '--config', 'Release']);
