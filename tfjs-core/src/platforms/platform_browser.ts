/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import { env } from '../environment';

import { Platform } from './platform';

export class PlatformBrowser implements Platform {
  // According to the spec, the built-in encoder can do only UTF-8 encoding.
  // https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/TextEncoder
  private textEncoder: TextEncoder;

  fetch(path: string, init?: RequestInit): Promise<Response> {
    return fetch(path, init);
  }

  now(): number {
    return performance.now();
  }

  encode(text: string, encoding: string): Uint8Array {
    if (encoding !== 'utf-8' && encoding !== 'utf8') {
      throw new Error(
        `Browser's encoder only supports utf-8, but got ${encoding}`);
    }
    if (this.textEncoder == null) {
      this.textEncoder = new TextEncoder();
    }
    return this.textEncoder.encode(text);
  }
  decode(bytes: Uint8Array, encoding: string): string {
    return new TextDecoder(encoding).decode(bytes);
  }

  FileReader.prototype.readAsArrayBuffer = function (blob) {
    if (this.readyState === this.LOADING) throw new Error("InvalidStateError");
    this._setReadyState(this.LOADING);
    this._result = null;
    this._error = null;
    const fr = new FileReader();
    fr.onloadend = () => {
      // const content = window.atob(fr.result.substr("data:application/octet-stream;base64,".length));
      const content = atob(fr.result.substr("data:application/octet-stream;base64,".length));
      const buffer = new ArrayBuffer(content.length);
      const view = new Uint8Array(buffer);
      view.set(Array.from(content).map(c => c.charCodeAt(0)));
      this._result = buffer;
      this._setReadyState(this.DONE);
    };
    fr.readAsDataURL(blob);
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const atob = (input = '') => {
    console.log('atob')
    let str = input.replace(/=+$/, '');
    let output = '';

    if (str.length % 4 == 1) {
      throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (let bc = 0, bs = 0, buffer, i = 0;
      buffer = str.charAt(i++);

      ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
        bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
      buffer = chars.indexOf(buffer);
    }

    return output;
  }
}

if (env().get('IS_BROWSER') || true) {
  env().setPlatform('browser', new PlatformBrowser());
}
