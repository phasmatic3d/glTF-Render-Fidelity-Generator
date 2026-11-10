/* @license
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import sharp from 'sharp';

export const GOLDEN_EXTENSION = 'webp';

export const goldenFilename = (renderer: string) =>
    `${renderer}-golden.${GOLDEN_EXTENSION}`;

/**
 * Re-encodes an image as lossless WebP.
 * `exact` keeps the RGB values of fully transparent pixels.
 */
export const encodeWebpLossless = (image: Uint8Array): Promise<Buffer> =>
    sharp(image).webp({lossless: true, exact: true, effort: 6}).toBuffer();

/**
 * Decodes an image to 8-bit RGBA pixels.
 */
export const decodeRGBA = async(image: Uint8Array):
    Promise<Uint8ClampedArray> => {
      const {data} =
          await sharp(image).ensureAlpha().raw({depth: 'uchar'}).toBuffer({
            resolveWithObject: true
          });
      return new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
    };
