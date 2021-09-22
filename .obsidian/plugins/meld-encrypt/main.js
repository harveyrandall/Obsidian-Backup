'use strict';

var obsidian = require('obsidian');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

class DecryptModal extends obsidian.Modal {
    constructor(app, title, text = '') {
        super(app);
        this.decryptInPlace = false;
        this.text = text;
        this.titleEl.innerText = title;
    }
    onOpen() {
        let { contentEl } = this;
        const textEl = contentEl.createDiv().createEl('textarea', { text: this.text });
        textEl.style.width = '100%';
        textEl.style.height = '100%';
        textEl.rows = 10;
        textEl.readOnly = true;
        //textEl.focus(); // Doesn't seem to work here...
        setTimeout(() => { textEl.focus(); }, 100); //... but this does
        const btnContainerEl = contentEl.createDiv('');
        const decryptInPlaceBtnEl = btnContainerEl.createEl('button', { text: 'Decrypt in-place' });
        decryptInPlaceBtnEl.addEventListener('click', () => {
            this.decryptInPlace = true;
            this.close();
        });
        const cancelBtnEl = btnContainerEl.createEl('button', { text: 'Close' });
        cancelBtnEl.addEventListener('click', () => {
            this.close();
        });
    }
}

class PasswordModal extends obsidian.Modal {
    constructor(app, confirmPassword, defaultPassword = null) {
        super(app);
        this.password = null;
        this.defaultPassword = null;
        this.defaultPassword = defaultPassword;
        this.confirmPassword = confirmPassword;
    }
    onOpen() {
        var _a, _b;
        let { contentEl } = this;
        contentEl.empty();
        const inputPwContainerEl = contentEl.createDiv();
        inputPwContainerEl.createSpan({ text: '🔑 ' });
        const pwInputEl = inputPwContainerEl.createEl('input', { type: 'password', value: (_a = this.defaultPassword) !== null && _a !== void 0 ? _a : '' });
        pwInputEl.placeholder = 'Enter your password';
        pwInputEl.style.width = '70%';
        pwInputEl.focus();
        const inputInputNextBtnEl = inputPwContainerEl.createEl('button', { text: '→' });
        inputInputNextBtnEl.style.display = 'inline';
        inputInputNextBtnEl.style.marginLeft = "1em";
        inputInputNextBtnEl.style.width = "4em";
        inputInputNextBtnEl.addEventListener('click', (ev) => {
            inputPasswordHandler();
        });
        const confirmPwContainerEl = contentEl.createDiv();
        confirmPwContainerEl.style.marginTop = '1em';
        confirmPwContainerEl.createSpan({ text: '🔑 ' });
        const pwConfirmInputEl = confirmPwContainerEl.createEl('input', { type: 'password', value: (_b = this.defaultPassword) !== null && _b !== void 0 ? _b : '' });
        pwConfirmInputEl.placeholder = 'Confirm your password';
        pwConfirmInputEl.style.width = '70%';
        const confirmInputNextBtnEl = confirmPwContainerEl.createEl('button', { text: '→' });
        confirmInputNextBtnEl.style.display = 'inline';
        confirmInputNextBtnEl.style.marginLeft = "1em";
        confirmInputNextBtnEl.style.width = "4em";
        confirmInputNextBtnEl.addEventListener('click', (ev) => {
            confirmPasswordHandler();
        });
        const inputPasswordHandler = () => {
            if (this.confirmPassword) {
                // confim password
                pwConfirmInputEl.focus();
            }
            else {
                this.password = pwInputEl.value;
                this.close();
            }
        };
        const confirmPasswordHandler = () => {
            if (pwInputEl.value == pwConfirmInputEl.value) {
                this.password = pwConfirmInputEl.value;
                this.close();
            }
            else {
                // passwords don't match
                messageEl.setText('Passwords don\'t match');
                messageEl.show();
            }
        };
        pwConfirmInputEl.addEventListener('keypress', (ev) => {
            if ((ev.code === 'Enter' || ev.code === 'NumpadEnter')
                && pwConfirmInputEl.value.length > 0) {
                ev.preventDefault();
                confirmPasswordHandler();
            }
        });
        if (!this.confirmPassword) {
            confirmPwContainerEl.hide();
        }
        const messageEl = contentEl.createDiv();
        messageEl.style.marginTop = '1em';
        messageEl.hide();
        pwInputEl.addEventListener('keypress', (ev) => {
            if ((ev.code === 'Enter' || ev.code === 'NumpadEnter')
                && pwInputEl.value.length > 0) {
                ev.preventDefault();
                inputPasswordHandler();
            }
        });
        // const btnContainerEl = contentEl.createDiv('');
        // btnContainerEl.style.marginTop = '1em';
        // const okBtnEl = btnContainerEl.createEl('button', { text: 'OK' });
        // okBtnEl.addEventListener('click', () => {
        // 	this.password = pwInputEl.value;
        // 	this.close();
        // });
        // const cancelBtnEl = btnContainerEl.createEl('button', { text: 'Cancel' });
        // cancelBtnEl.addEventListener('click', () => {
        // 	this.close();
        // });
    }
}

const vectorSize = 16;
const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder();
const iterations = 1000;
const salt = utf8Encoder.encode('XHWnDAT6ehMVY2zD');
class CryptoHelperV2 {
    deriveKey(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const buffer = utf8Encoder.encode(password);
            const key = yield crypto.subtle.importKey('raw', buffer, { name: 'PBKDF2' }, false, ['deriveKey']);
            const privateKey = crypto.subtle.deriveKey({
                name: 'PBKDF2',
                hash: { name: 'SHA-256' },
                iterations,
                salt
            }, key, {
                name: 'AES-GCM',
                length: 256
            }, false, ['encrypt', 'decrypt']);
            return privateKey;
        });
    }
    encryptToBase64(text, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = yield this.deriveKey(password);
            const textBytesToEncrypt = utf8Encoder.encode(text);
            const vector = crypto.getRandomValues(new Uint8Array(vectorSize));
            // encrypt into bytes
            const encryptedBytes = new Uint8Array(yield crypto.subtle.encrypt({ name: 'AES-GCM', iv: vector }, key, textBytesToEncrypt));
            const finalBytes = new Uint8Array(vector.byteLength + encryptedBytes.byteLength);
            finalBytes.set(vector, 0);
            finalBytes.set(encryptedBytes, vector.byteLength);
            //convert array to base64
            const base64Text = btoa(String.fromCharCode(...finalBytes));
            return base64Text;
        });
    }
    stringToArray(str) {
        var result = [];
        for (var i = 0; i < str.length; i++) {
            result.push(str.charCodeAt(i));
        }
        return new Uint8Array(result);
    }
    decryptFromBase64(base64Encoded, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let bytesToDecode = this.stringToArray(atob(base64Encoded));
                // extract iv
                const vector = bytesToDecode.slice(0, vectorSize);
                // extract encrypted text
                const encryptedTextBytes = bytesToDecode.slice(vectorSize);
                const key = yield this.deriveKey(password);
                // decrypt into bytes
                let decryptedBytes = yield crypto.subtle.decrypt({ name: 'AES-GCM', iv: vector }, key, encryptedTextBytes);
                // convert bytes to text
                let decryptedText = utf8Decoder.decode(decryptedBytes);
                return decryptedText;
            }
            catch (e) {
                //console.error(e);
                return null;
            }
        });
    }
}
const algorithmObsolete = {
    name: 'AES-GCM',
    iv: new Uint8Array([196, 190, 240, 190, 188, 78, 41, 132, 15, 220, 84, 211]),
    tagLength: 128
};
class CryptoHelperObsolete {
    buildKey(password) {
        return __awaiter(this, void 0, void 0, function* () {
            let utf8Encode = new TextEncoder();
            let passwordBytes = utf8Encode.encode(password);
            let passwordDigest = yield crypto.subtle.digest({ name: 'SHA-256' }, passwordBytes);
            let key = yield crypto.subtle.importKey('raw', passwordDigest, algorithmObsolete, false, ['encrypt', 'decrypt']);
            return key;
        });
    }
    encryptToBase64(text, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let key = yield this.buildKey(password);
            let utf8Encode = new TextEncoder();
            let bytesToEncrypt = utf8Encode.encode(text);
            // encrypt into bytes
            let encryptedBytes = new Uint8Array(yield crypto.subtle.encrypt(algorithmObsolete, key, bytesToEncrypt));
            //convert array to base64
            let base64Text = btoa(String.fromCharCode(...encryptedBytes));
            return base64Text;
        });
    }
    stringToArray(str) {
        var result = [];
        for (var i = 0; i < str.length; i++) {
            result.push(str.charCodeAt(i));
        }
        return new Uint8Array(result);
    }
    decryptFromBase64(base64Encoded, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // convert base 64 to array
                let bytesToDecrypt = this.stringToArray(atob(base64Encoded));
                let key = yield this.buildKey(password);
                // decrypt into bytes
                let decryptedBytes = yield crypto.subtle.decrypt(algorithmObsolete, key, bytesToDecrypt);
                // convert bytes to text
                let utf8Decode = new TextDecoder();
                let decryptedText = utf8Decode.decode(decryptedBytes);
                return decryptedText;
            }
            catch (e) {
                return null;
            }
        });
    }
}

class MeldEncryptSettingsTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        let { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Settings for Meld Encrypt' });
        new obsidian.Setting(containerEl)
            .setName('Confirm password?')
            .setDesc('Confirm password when encrypting.')
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.confirmPassword)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.confirmPassword = value;
                yield this.plugin.saveSettings();
                this.updateSettingsUi();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName('Remember password?')
            .setDesc('Remember the last used password for this session.')
            .addToggle(toggle => {
            toggle
                .setValue(this.plugin.settings.rememberPassword)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.rememberPassword = value;
                yield this.plugin.saveSettings();
                this.updateSettingsUi();
            }));
        });
        this.pwTimeoutSetting = new obsidian.Setting(containerEl)
            .setName(this.buildPasswordTimeoutSettingName())
            .setDesc('The number of minutes to remember the last used password.')
            .addSlider(slider => {
            slider
                .setLimits(0, 120, 5)
                .setValue(this.plugin.settings.rememberPasswordTimeout)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.rememberPasswordTimeout = value;
                yield this.plugin.saveSettings();
                this.updateSettingsUi();
            }));
        });
        this.updateSettingsUi();
    }
    updateSettingsUi() {
        this.pwTimeoutSetting.setName(this.buildPasswordTimeoutSettingName());
        if (this.plugin.settings.rememberPassword) {
            this.pwTimeoutSetting.settingEl.show();
        }
        else {
            this.pwTimeoutSetting.settingEl.hide();
        }
    }
    buildPasswordTimeoutSettingName() {
        const value = this.plugin.settings.rememberPasswordTimeout;
        let timeoutString = `${value} minutes`;
        if (value == 0) {
            timeoutString = 'Never forget';
        }
        return `Remember Password Timeout (${timeoutString})`;
    }
}

const _PREFIX_OBSOLETE = '%%🔐 ';
const _PREFIX_A = '%%🔐α ';
const _SUFFIX = ' 🔐%%';
const DEFAULT_SETTINGS = {
    confirmPassword: true,
    rememberPassword: true,
    rememberPasswordTimeout: 30
};
class MeldEncrypt extends obsidian.Plugin {
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            this.addSettingTab(new MeldEncryptSettingsTab(this.app, this));
            this.addCommand({
                id: 'encrypt-decrypt',
                name: 'Encrypt/Decrypt',
                checkCallback: (checking) => this.processEncryptDecryptCommand(checking, false)
            });
            this.addCommand({
                id: 'encrypt-decrypt-in-place',
                name: 'Encrypt/Decrypt In-place',
                checkCallback: (checking) => this.processEncryptDecryptCommand(checking, true)
            });
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
    processEncryptDecryptCommand(checking, decryptInPlace) {
        const mdview = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (!mdview) {
            return false;
        }
        const editor = mdview.editor;
        if (!editor) {
            return false;
        }
        const startLine = editor.getCursor('from').line;
        const startPos = { line: startLine, ch: 0 }; // want the start of the first line
        const endLine = editor.getCursor('to').line;
        const endLineText = editor.getLine(endLine);
        const endPos = { line: endLine, ch: endLineText.length }; // want the end of last line
        const selectionText = editor.getRange(startPos, endPos);
        if (selectionText.length == 0) {
            return false;
        }
        const decrypt_obs = selectionText.startsWith(_PREFIX_OBSOLETE) && selectionText.endsWith(_SUFFIX);
        const decrypt_a = selectionText.startsWith(_PREFIX_A) && selectionText.endsWith(_SUFFIX);
        const decrypt = decrypt_obs || decrypt_a;
        const encrypt = !selectionText.contains(_PREFIX_OBSOLETE) && !selectionText.contains(_SUFFIX);
        if (!decrypt && !encrypt) {
            return false;
        }
        if (checking) {
            return true;
        }
        // Fetch password from user
        // determine default password
        const isRememberPasswordExpired = !this.settings.rememberPassword
            || (this.passwordLastUsedExpiry != null
                && Date.now() > this.passwordLastUsedExpiry);
        const confirmPassword = encrypt && this.settings.confirmPassword;
        if (isRememberPasswordExpired || confirmPassword) {
            // forget password
            this.passwordLastUsed = '';
        }
        const pwModal = new PasswordModal(this.app, confirmPassword, this.passwordLastUsed);
        pwModal.onClose = () => {
            var _a;
            const pw = (_a = pwModal.password) !== null && _a !== void 0 ? _a : '';
            if (pw.length == 0) {
                return;
            }
            // remember password?
            if (this.settings.rememberPassword) {
                this.passwordLastUsed = pw;
                this.passwordLastUsedExpiry =
                    this.settings.rememberPasswordTimeout == 0
                        ? null
                        : Date.now() + this.settings.rememberPasswordTimeout * 1000 * 60 // new expiry
                ;
            }
            if (encrypt) {
                this.encryptSelection(editor, selectionText, pw, startPos, endPos);
            }
            else {
                if (decrypt_a) {
                    this.decryptSelection_a(editor, selectionText, pw, startPos, endPos, decryptInPlace);
                }
                else {
                    this.decryptSelectionObsolete(editor, selectionText, pw, startPos, endPos, decryptInPlace);
                }
            }
        };
        pwModal.open();
        return true;
    }
    encryptSelection(editor, selectionText, password, finalSelectionStart, finalSelectionEnd) {
        return __awaiter(this, void 0, void 0, function* () {
            //encrypt
            const crypto = new CryptoHelperV2();
            const base64EncryptedText = this.addMarkers(yield crypto.encryptToBase64(selectionText, password));
            editor.setSelection(finalSelectionStart, finalSelectionEnd);
            editor.replaceSelection(base64EncryptedText);
        });
    }
    decryptSelection_a(editor, selectionText, password, selectionStart, selectionEnd, decryptInPlace) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('decryptSelection_a');
            // decrypt
            const base64CipherText = this.removeMarkers(selectionText);
            const crypto = new CryptoHelperV2();
            const decryptedText = yield crypto.decryptFromBase64(base64CipherText, password);
            if (decryptedText === null) {
                new obsidian.Notice('❌ Decryption failed!');
            }
            else {
                if (decryptInPlace) {
                    editor.setSelection(selectionStart, selectionEnd);
                    editor.replaceSelection(decryptedText);
                }
                else {
                    const decryptModal = new DecryptModal(this.app, '🔓', decryptedText);
                    decryptModal.onClose = () => {
                        editor.focus();
                        if (decryptModal.decryptInPlace) {
                            editor.setSelection(selectionStart, selectionEnd);
                            editor.replaceSelection(decryptedText);
                        }
                    };
                    decryptModal.open();
                }
            }
        });
    }
    decryptSelectionObsolete(editor, selectionText, password, selectionStart, selectionEnd, decryptInPlace) {
        return __awaiter(this, void 0, void 0, function* () {
            //console.log('decryptSelectionObsolete');
            // decrypt
            const base64CipherText = this.removeMarkers(selectionText);
            const crypto = new CryptoHelperObsolete();
            const decryptedText = yield crypto.decryptFromBase64(base64CipherText, password);
            if (decryptedText === null) {
                new obsidian.Notice('❌ Decryption failed!');
            }
            else {
                if (decryptInPlace) {
                    editor.setSelection(selectionStart, selectionEnd);
                    editor.replaceSelection(decryptedText);
                }
                else {
                    const decryptModal = new DecryptModal(this.app, '🔓', decryptedText);
                    decryptModal.onClose = () => {
                        editor.focus();
                        if (decryptModal.decryptInPlace) {
                            editor.setSelection(selectionStart, selectionEnd);
                            editor.replaceSelection(decryptedText);
                        }
                    };
                    decryptModal.open();
                }
            }
        });
    }
    removeMarkers(text) {
        if (text.startsWith(_PREFIX_A) && text.endsWith(_SUFFIX)) {
            return text.replace(_PREFIX_A, '').replace(_SUFFIX, '');
        }
        if (text.startsWith(_PREFIX_OBSOLETE) && text.endsWith(_SUFFIX)) {
            return text.replace(_PREFIX_OBSOLETE, '').replace(_SUFFIX, '');
        }
        return text;
    }
    addMarkers(text) {
        if (!text.contains(_PREFIX_OBSOLETE) && !text.contains(_PREFIX_A) && !text.contains(_SUFFIX)) {
            return _PREFIX_A.concat(text, _SUFFIX);
        }
        return text;
    }
}

module.exports = MeldEncrypt;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIi4uL3NyYy9EZWNyeXB0TW9kYWwudHMiLCIuLi9zcmMvUGFzc3dvcmRNb2RhbC50cyIsIi4uL3NyYy9DcnlwdG9IZWxwZXIudHMiLCIuLi9zcmMvTWVsZEVuY3J5cHRTZXR0aW5nc1RhYi50cyIsIi4uL3NyYy9tYWluLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5Db3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi5cclxuXHJcblBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueVxyXG5wdXJwb3NlIHdpdGggb3Igd2l0aG91dCBmZWUgaXMgaGVyZWJ5IGdyYW50ZWQuXHJcblxyXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIXHJcblJFR0FSRCBUTyBUSElTIFNPRlRXQVJFIElOQ0xVRElORyBBTEwgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWVxyXG5BTkQgRklUTkVTUy4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUiBCRSBMSUFCTEUgRk9SIEFOWSBTUEVDSUFMLCBESVJFQ1QsXHJcbklORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTVxyXG5MT1NTIE9GIFVTRSwgREFUQSBPUiBQUk9GSVRTLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgTkVHTElHRU5DRSBPUlxyXG5PVEhFUiBUT1JUSU9VUyBBQ1RJT04sIEFSSVNJTkcgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgVVNFIE9SXHJcblBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXHJcbi8qIGdsb2JhbCBSZWZsZWN0LCBQcm9taXNlICovXHJcblxyXG52YXIgZXh0ZW5kU3RhdGljcyA9IGZ1bmN0aW9uKGQsIGIpIHtcclxuICAgIGV4dGVuZFN0YXRpY3MgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YgfHxcclxuICAgICAgICAoeyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheSAmJiBmdW5jdGlvbiAoZCwgYikgeyBkLl9fcHJvdG9fXyA9IGI7IH0pIHx8XHJcbiAgICAgICAgZnVuY3Rpb24gKGQsIGIpIHsgZm9yICh2YXIgcCBpbiBiKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGIsIHApKSBkW3BdID0gYltwXTsgfTtcclxuICAgIHJldHVybiBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZXh0ZW5kcyhkLCBiKSB7XHJcbiAgICBpZiAodHlwZW9mIGIgIT09IFwiZnVuY3Rpb25cIiAmJiBiICE9PSBudWxsKVxyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDbGFzcyBleHRlbmRzIHZhbHVlIFwiICsgU3RyaW5nKGIpICsgXCIgaXMgbm90IGEgY29uc3RydWN0b3Igb3IgbnVsbFwiKTtcclxuICAgIGV4dGVuZFN0YXRpY3MoZCwgYik7XHJcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2Fzc2lnbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uIF9fYXNzaWduKHQpIHtcclxuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcclxuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcclxuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKSB0W3BdID0gc1twXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fcmVzdChzLCBlKSB7XHJcbiAgICB2YXIgdCA9IHt9O1xyXG4gICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApICYmIGUuaW5kZXhPZihwKSA8IDApXHJcbiAgICAgICAgdFtwXSA9IHNbcF07XHJcbiAgICBpZiAocyAhPSBudWxsICYmIHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHAgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHMpOyBpIDwgcC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZS5pbmRleE9mKHBbaV0pIDwgMCAmJiBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwocywgcFtpXSkpXHJcbiAgICAgICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcclxuICAgICAgICB9XHJcbiAgICByZXR1cm4gdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcclxuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xyXG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcclxuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3BhcmFtKHBhcmFtSW5kZXgsIGRlY29yYXRvcikge1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKSB7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdGVyKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xyXG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XHJcbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XHJcbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cclxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHtcclxuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGc7XHJcbiAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgXCJ0aHJvd1wiOiB2ZXJiKDEpLCBcInJldHVyblwiOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xyXG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcclxuICAgICAgICB3aGlsZSAoXykgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xyXG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XHJcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxyXG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgdmFyIF9fY3JlYXRlQmluZGluZyA9IE9iamVjdC5jcmVhdGUgPyAoZnVuY3Rpb24obywgbSwgaywgazIpIHtcclxuICAgIGlmIChrMiA9PT0gdW5kZWZpbmVkKSBrMiA9IGs7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgazIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ba107IH0gfSk7XHJcbn0pIDogKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgb1trMl0gPSBtW2tdO1xyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4cG9ydFN0YXIobSwgbykge1xyXG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAocCAhPT0gXCJkZWZhdWx0XCIgJiYgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvLCBwKSkgX19jcmVhdGVCaW5kaW5nKG8sIG0sIHApO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX192YWx1ZXMobykge1xyXG4gICAgdmFyIHMgPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgU3ltYm9sLml0ZXJhdG9yLCBtID0gcyAmJiBvW3NdLCBpID0gMDtcclxuICAgIGlmIChtKSByZXR1cm4gbS5jYWxsKG8pO1xyXG4gICAgaWYgKG8gJiYgdHlwZW9mIG8ubGVuZ3RoID09PSBcIm51bWJlclwiKSByZXR1cm4ge1xyXG4gICAgICAgIG5leHQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKG8gJiYgaSA+PSBvLmxlbmd0aCkgbyA9IHZvaWQgMDtcclxuICAgICAgICAgICAgcmV0dXJuIHsgdmFsdWU6IG8gJiYgb1tpKytdLCBkb25lOiAhbyB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKHMgPyBcIk9iamVjdCBpcyBub3QgaXRlcmFibGUuXCIgOiBcIlN5bWJvbC5pdGVyYXRvciBpcyBub3QgZGVmaW5lZC5cIik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3JlYWQobywgbikge1xyXG4gICAgdmFyIG0gPSB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb1tTeW1ib2wuaXRlcmF0b3JdO1xyXG4gICAgaWYgKCFtKSByZXR1cm4gbztcclxuICAgIHZhciBpID0gbS5jYWxsKG8pLCByLCBhciA9IFtdLCBlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB3aGlsZSAoKG4gPT09IHZvaWQgMCB8fCBuLS0gPiAwKSAmJiAhKHIgPSBpLm5leHQoKSkuZG9uZSkgYXIucHVzaChyLnZhbHVlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlcnJvcikgeyBlID0geyBlcnJvcjogZXJyb3IgfTsgfVxyXG4gICAgZmluYWxseSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHIgJiYgIXIuZG9uZSAmJiAobSA9IGlbXCJyZXR1cm5cIl0pKSBtLmNhbGwoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsbHkgeyBpZiAoZSkgdGhyb3cgZS5lcnJvcjsgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkKCkge1xyXG4gICAgZm9yICh2YXIgYXIgPSBbXSwgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgYXIgPSBhci5jb25jYXQoX19yZWFkKGFyZ3VtZW50c1tpXSkpO1xyXG4gICAgcmV0dXJuIGFyO1xyXG59XHJcblxyXG4vKiogQGRlcHJlY2F0ZWQgKi9cclxuZXhwb3J0IGZ1bmN0aW9uIF9fc3ByZWFkQXJyYXlzKCkge1xyXG4gICAgZm9yICh2YXIgcyA9IDAsIGkgPSAwLCBpbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKSBzICs9IGFyZ3VtZW50c1tpXS5sZW5ndGg7XHJcbiAgICBmb3IgKHZhciByID0gQXJyYXkocyksIGsgPSAwLCBpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgZm9yICh2YXIgYSA9IGFyZ3VtZW50c1tpXSwgaiA9IDAsIGpsID0gYS5sZW5ndGg7IGogPCBqbDsgaisrLCBrKyspXHJcbiAgICAgICAgICAgIHJba10gPSBhW2pdO1xyXG4gICAgcmV0dXJuIHI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5KHRvLCBmcm9tLCBwYWNrKSB7XHJcbiAgICBpZiAocGFjayB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAyKSBmb3IgKHZhciBpID0gMCwgbCA9IGZyb20ubGVuZ3RoLCBhcjsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcclxuICAgICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcclxuICAgICAgICAgICAgYXJbaV0gPSBmcm9tW2ldO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiB0by5jb25jYXQoYXIgfHwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSkpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBzdGF0ZSwga2luZCwgZikge1xyXG4gICAgaWYgKGtpbmQgPT09IFwiYVwiICYmICFmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiUHJpdmF0ZSBhY2Nlc3NvciB3YXMgZGVmaW5lZCB3aXRob3V0IGEgZ2V0dGVyXCIpO1xyXG4gICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gXCJmdW5jdGlvblwiID8gcmVjZWl2ZXIgIT09IHN0YXRlIHx8ICFmIDogIXN0YXRlLmhhcyhyZWNlaXZlcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgcmVhZCBwcml2YXRlIG1lbWJlciBmcm9tIGFuIG9iamVjdCB3aG9zZSBjbGFzcyBkaWQgbm90IGRlY2xhcmUgaXRcIik7XHJcbiAgICByZXR1cm4ga2luZCA9PT0gXCJtXCIgPyBmIDoga2luZCA9PT0gXCJhXCIgPyBmLmNhbGwocmVjZWl2ZXIpIDogZiA/IGYudmFsdWUgOiBzdGF0ZS5nZXQocmVjZWl2ZXIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19jbGFzc1ByaXZhdGVGaWVsZFNldChyZWNlaXZlciwgc3RhdGUsIHZhbHVlLCBraW5kLCBmKSB7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJtXCIpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIG1ldGhvZCBpcyBub3Qgd3JpdGFibGVcIik7XHJcbiAgICBpZiAoa2luZCA9PT0gXCJhXCIgJiYgIWYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJQcml2YXRlIGFjY2Vzc29yIHdhcyBkZWZpbmVkIHdpdGhvdXQgYSBzZXR0ZXJcIik7XHJcbiAgICBpZiAodHlwZW9mIHN0YXRlID09PSBcImZ1bmN0aW9uXCIgPyByZWNlaXZlciAhPT0gc3RhdGUgfHwgIWYgOiAhc3RhdGUuaGFzKHJlY2VpdmVyKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB3cml0ZSBwcml2YXRlIG1lbWJlciB0byBhbiBvYmplY3Qgd2hvc2UgY2xhc3MgZGlkIG5vdCBkZWNsYXJlIGl0XCIpO1xyXG4gICAgcmV0dXJuIChraW5kID09PSBcImFcIiA/IGYuY2FsbChyZWNlaXZlciwgdmFsdWUpIDogZiA/IGYudmFsdWUgPSB2YWx1ZSA6IHN0YXRlLnNldChyZWNlaXZlciwgdmFsdWUpKSwgdmFsdWU7XHJcbn1cclxuIiwiaW1wb3J0IHsgQXBwLCBNb2RhbCB9IGZyb20gJ29ic2lkaWFuJztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIERlY3J5cHRNb2RhbCBleHRlbmRzIE1vZGFsIHtcclxuXHR0ZXh0OiBzdHJpbmc7XHJcblx0ZGVjcnlwdEluUGxhY2U6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblx0Y29uc3RydWN0b3IoYXBwOiBBcHAsIHRpdGxlOiBzdHJpbmcsIHRleHQ6IHN0cmluZyA9ICcnKSB7XHJcblx0XHRzdXBlcihhcHApO1xyXG5cdFx0dGhpcy50ZXh0ID0gdGV4dDtcclxuXHRcdHRoaXMudGl0bGVFbC5pbm5lclRleHQgPSB0aXRsZTtcclxuXHR9XHJcblxyXG5cdG9uT3BlbigpIHtcclxuXHRcdGxldCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcclxuXHJcblx0XHRjb25zdCB0ZXh0RWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KCkuY3JlYXRlRWwoJ3RleHRhcmVhJywgeyB0ZXh0OiB0aGlzLnRleHQgfSk7XHJcblx0XHR0ZXh0RWwuc3R5bGUud2lkdGggPSAnMTAwJSc7XHJcblx0XHR0ZXh0RWwuc3R5bGUuaGVpZ2h0ID0gJzEwMCUnO1xyXG5cdFx0dGV4dEVsLnJvd3MgPSAxMDtcclxuXHRcdHRleHRFbC5yZWFkT25seSA9IHRydWU7XHJcblx0XHQvL3RleHRFbC5mb2N1cygpOyAvLyBEb2Vzbid0IHNlZW0gdG8gd29yayBoZXJlLi4uXHJcblx0XHRzZXRUaW1lb3V0KCgpID0+IHsgdGV4dEVsLmZvY3VzKCkgfSwxMDApOyAvLy4uLiBidXQgdGhpcyBkb2VzXHJcblxyXG5cclxuXHRcdGNvbnN0IGJ0bkNvbnRhaW5lckVsID0gY29udGVudEVsLmNyZWF0ZURpdignJyk7XHJcblxyXG5cdFx0Y29uc3QgZGVjcnlwdEluUGxhY2VCdG5FbCA9IGJ0bkNvbnRhaW5lckVsLmNyZWF0ZUVsKCdidXR0b24nLCB7IHRleHQ6ICdEZWNyeXB0IGluLXBsYWNlJyB9KTtcclxuXHRcdGRlY3J5cHRJblBsYWNlQnRuRWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcblx0XHRcdHRoaXMuZGVjcnlwdEluUGxhY2UgPSB0cnVlO1xyXG5cdFx0XHR0aGlzLmNsb3NlKCk7XHJcblx0XHR9KTtcclxuXHJcblx0XHRjb25zdCBjYW5jZWxCdG5FbCA9IGJ0bkNvbnRhaW5lckVsLmNyZWF0ZUVsKCdidXR0b24nLCB7IHRleHQ6ICdDbG9zZScgfSk7XHJcblx0XHRjYW5jZWxCdG5FbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuXHRcdFx0dGhpcy5jbG9zZSgpO1xyXG5cdFx0fSk7XHJcblxyXG5cdH1cclxuXHJcbn0iLCJpbXBvcnQgeyBBcHAsIE1vZGFsIH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUGFzc3dvcmRNb2RhbCBleHRlbmRzIE1vZGFsIHtcclxuXHRwYXNzd29yZDogc3RyaW5nID0gbnVsbDtcclxuXHRkZWZhdWx0UGFzc3dvcmQ6IHN0cmluZyA9IG51bGw7XHJcblx0Y29uZmlybVBhc3N3b3JkOiBib29sZWFuO1xyXG5cclxuXHRjb25zdHJ1Y3RvcihhcHA6IEFwcCwgY29uZmlybVBhc3N3b3JkOiBib29sZWFuLCBkZWZhdWx0UGFzc3dvcmQ6IHN0cmluZyA9IG51bGwpIHtcclxuXHRcdHN1cGVyKGFwcCk7XHJcblx0XHR0aGlzLmRlZmF1bHRQYXNzd29yZCA9IGRlZmF1bHRQYXNzd29yZDtcclxuXHRcdHRoaXMuY29uZmlybVBhc3N3b3JkID0gY29uZmlybVBhc3N3b3JkO1xyXG5cdH1cclxuXHJcblx0b25PcGVuKCkge1xyXG5cdFx0bGV0IHsgY29udGVudEVsIH0gPSB0aGlzO1xyXG5cclxuXHRcdGNvbnRlbnRFbC5lbXB0eSgpO1xyXG5cclxuXHRcdGNvbnN0IGlucHV0UHdDb250YWluZXJFbCA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoKTtcclxuXHRcdGlucHV0UHdDb250YWluZXJFbC5jcmVhdGVTcGFuKHsgdGV4dDogJ/CflJEgJyB9KTtcclxuXHRcdFxyXG5cdFx0Y29uc3QgcHdJbnB1dEVsID0gaW5wdXRQd0NvbnRhaW5lckVsLmNyZWF0ZUVsKCdpbnB1dCcsIHsgdHlwZTogJ3Bhc3N3b3JkJywgdmFsdWU6IHRoaXMuZGVmYXVsdFBhc3N3b3JkID8/ICcnIH0pO1xyXG5cdFx0cHdJbnB1dEVsLnBsYWNlaG9sZGVyID0gJ0VudGVyIHlvdXIgcGFzc3dvcmQnO1xyXG5cdFx0cHdJbnB1dEVsLnN0eWxlLndpZHRoID0gJzcwJSc7XHJcblx0XHRwd0lucHV0RWwuZm9jdXMoKTtcclxuXHJcblx0XHRjb25zdCBpbnB1dElucHV0TmV4dEJ0bkVsID0gaW5wdXRQd0NvbnRhaW5lckVsLmNyZWF0ZUVsKCdidXR0b24nLCB7IHRleHQ6ICfihpInIH0pO1xyXG5cdFx0aW5wdXRJbnB1dE5leHRCdG5FbC5zdHlsZS5kaXNwbGF5ID0gJ2lubGluZSc7XHJcblx0XHRpbnB1dElucHV0TmV4dEJ0bkVsLnN0eWxlLm1hcmdpbkxlZnQgPSBcIjFlbVwiO1xyXG5cdFx0aW5wdXRJbnB1dE5leHRCdG5FbC5zdHlsZS53aWR0aCA9IFwiNGVtXCI7XHJcblx0XHRpbnB1dElucHV0TmV4dEJ0bkVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2KSA9PiB7XHJcblx0XHRcdGlucHV0UGFzc3dvcmRIYW5kbGVyKCk7XHJcblx0XHR9KTtcclxuXHJcblxyXG5cdFx0Y29uc3QgY29uZmlybVB3Q29udGFpbmVyRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KCk7XHJcblx0XHRjb25maXJtUHdDb250YWluZXJFbC5zdHlsZS5tYXJnaW5Ub3AgPSAnMWVtJztcclxuXHRcdGNvbmZpcm1Qd0NvbnRhaW5lckVsLmNyZWF0ZVNwYW4oeyB0ZXh0OiAn8J+UkSAnIH0pO1xyXG5cdFx0XHJcblx0XHRjb25zdCBwd0NvbmZpcm1JbnB1dEVsID0gY29uZmlybVB3Q29udGFpbmVyRWwuY3JlYXRlRWwoJ2lucHV0JywgeyB0eXBlOiAncGFzc3dvcmQnLCB2YWx1ZTogdGhpcy5kZWZhdWx0UGFzc3dvcmQgPz8gJycgfSk7XHJcblx0XHRwd0NvbmZpcm1JbnB1dEVsLnBsYWNlaG9sZGVyID0gJ0NvbmZpcm0geW91ciBwYXNzd29yZCc7XHJcblx0XHRwd0NvbmZpcm1JbnB1dEVsLnN0eWxlLndpZHRoID0gJzcwJSc7XHJcblxyXG5cdFx0Y29uc3QgY29uZmlybUlucHV0TmV4dEJ0bkVsID0gY29uZmlybVB3Q29udGFpbmVyRWwuY3JlYXRlRWwoJ2J1dHRvbicsIHsgdGV4dDogJ+KGkicgfSk7XHJcblx0XHRjb25maXJtSW5wdXROZXh0QnRuRWwuc3R5bGUuZGlzcGxheSA9ICdpbmxpbmUnO1xyXG5cdFx0Y29uZmlybUlucHV0TmV4dEJ0bkVsLnN0eWxlLm1hcmdpbkxlZnQgPSBcIjFlbVwiO1xyXG5cdFx0Y29uZmlybUlucHV0TmV4dEJ0bkVsLnN0eWxlLndpZHRoID0gXCI0ZW1cIjtcclxuXHRcdGNvbmZpcm1JbnB1dE5leHRCdG5FbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldikgPT4ge1xyXG5cdFx0XHRjb25maXJtUGFzc3dvcmRIYW5kbGVyKCk7XHJcblx0XHR9KTtcclxuXHRcdFxyXG5cdFx0Y29uc3QgaW5wdXRQYXNzd29yZEhhbmRsZXIgPSAoKSA9PntcclxuXHRcdFx0aWYgKHRoaXMuY29uZmlybVBhc3N3b3JkKSB7XHJcblx0XHRcdFx0Ly8gY29uZmltIHBhc3N3b3JkXHJcblx0XHRcdFx0cHdDb25maXJtSW5wdXRFbC5mb2N1cygpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRoaXMucGFzc3dvcmQgPSBwd0lucHV0RWwudmFsdWU7XHJcblx0XHRcdFx0dGhpcy5jbG9zZSgpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgY29uZmlybVBhc3N3b3JkSGFuZGxlciA9ICgpID0+IHtcclxuXHRcdFx0aWYgKHB3SW5wdXRFbC52YWx1ZSA9PSBwd0NvbmZpcm1JbnB1dEVsLnZhbHVlKXtcclxuXHRcdFx0XHR0aGlzLnBhc3N3b3JkID0gcHdDb25maXJtSW5wdXRFbC52YWx1ZTtcclxuXHRcdFx0XHR0aGlzLmNsb3NlKCk7XHJcblx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdC8vIHBhc3N3b3JkcyBkb24ndCBtYXRjaFxyXG5cdFx0XHRcdG1lc3NhZ2VFbC5zZXRUZXh0KCdQYXNzd29yZHMgZG9uXFwndCBtYXRjaCcpO1xyXG5cdFx0XHRcdG1lc3NhZ2VFbC5zaG93KCk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblxyXG5cdFx0cHdDb25maXJtSW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIChldikgPT4ge1xyXG5cdFx0XHRpZiAoXHJcblx0XHRcdFx0KCBldi5jb2RlID09PSAnRW50ZXInIHx8IGV2LmNvZGUgPT09ICdOdW1wYWRFbnRlcicgKVxyXG5cdFx0XHRcdCYmIHB3Q29uZmlybUlucHV0RWwudmFsdWUubGVuZ3RoID4gMFxyXG5cdFx0XHQpIHtcclxuXHRcdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdGNvbmZpcm1QYXNzd29yZEhhbmRsZXIoKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0XHRcclxuXHJcblx0XHRpZiAoIXRoaXMuY29uZmlybVBhc3N3b3JkKSB7XHJcblx0XHRcdGNvbmZpcm1Qd0NvbnRhaW5lckVsLmhpZGUoKTtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBtZXNzYWdlRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KCk7XHJcblx0XHRtZXNzYWdlRWwuc3R5bGUubWFyZ2luVG9wID0gJzFlbSc7XHJcblx0XHRtZXNzYWdlRWwuaGlkZSgpO1xyXG5cclxuXHRcdHB3SW5wdXRFbC5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIChldikgPT4ge1xyXG5cdFx0XHRpZiAoXHJcblx0XHRcdFx0KCBldi5jb2RlID09PSAnRW50ZXInIHx8IGV2LmNvZGUgPT09ICdOdW1wYWRFbnRlcicgKVxyXG5cdFx0XHRcdCYmIHB3SW5wdXRFbC52YWx1ZS5sZW5ndGggPiAwXHJcblx0XHRcdCkge1xyXG5cdFx0XHRcdGV2LnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdFx0aW5wdXRQYXNzd29yZEhhbmRsZXIoKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0Ly8gY29uc3QgYnRuQ29udGFpbmVyRWwgPSBjb250ZW50RWwuY3JlYXRlRGl2KCcnKTtcclxuXHRcdC8vIGJ0bkNvbnRhaW5lckVsLnN0eWxlLm1hcmdpblRvcCA9ICcxZW0nO1xyXG5cclxuXHRcdC8vIGNvbnN0IG9rQnRuRWwgPSBidG5Db250YWluZXJFbC5jcmVhdGVFbCgnYnV0dG9uJywgeyB0ZXh0OiAnT0snIH0pO1xyXG5cdFx0Ly8gb2tCdG5FbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuXHRcdC8vIFx0dGhpcy5wYXNzd29yZCA9IHB3SW5wdXRFbC52YWx1ZTtcclxuXHRcdC8vIFx0dGhpcy5jbG9zZSgpO1xyXG5cdFx0Ly8gfSk7XHJcblxyXG5cdFx0Ly8gY29uc3QgY2FuY2VsQnRuRWwgPSBidG5Db250YWluZXJFbC5jcmVhdGVFbCgnYnV0dG9uJywgeyB0ZXh0OiAnQ2FuY2VsJyB9KTtcclxuXHRcdC8vIGNhbmNlbEJ0bkVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG5cdFx0Ly8gXHR0aGlzLmNsb3NlKCk7XHJcblx0XHQvLyB9KTtcclxuXHJcblxyXG5cdH1cclxuXHJcbn0iLCJjb25zdCB2ZWN0b3JTaXplXHQ9IDE2O1xyXG5jb25zdCB1dGY4RW5jb2Rlclx0PSBuZXcgVGV4dEVuY29kZXIoKTtcclxuY29uc3QgdXRmOERlY29kZXJcdD0gbmV3IFRleHREZWNvZGVyKCk7XHJcbmNvbnN0IGl0ZXJhdGlvbnNcdD0gMTAwMDtcclxuY29uc3Qgc2FsdFx0XHRcdD0gdXRmOEVuY29kZXIuZW5jb2RlKCdYSFduREFUNmVoTVZZMnpEJyk7XHJcblxyXG5leHBvcnQgY2xhc3MgQ3J5cHRvSGVscGVyVjIge1xyXG5cclxuXHRwcml2YXRlIGFzeW5jIGRlcml2ZUtleShwYXNzd29yZDpzdHJpbmcpIDpQcm9taXNlPENyeXB0b0tleT4ge1xyXG5cdFx0Y29uc3QgYnVmZmVyICAgICA9IHV0ZjhFbmNvZGVyLmVuY29kZShwYXNzd29yZCk7XHJcblx0XHRjb25zdCBrZXkgICAgICAgID0gYXdhaXQgY3J5cHRvLnN1YnRsZS5pbXBvcnRLZXkoJ3JhdycsIGJ1ZmZlciwge25hbWU6ICdQQktERjInfSwgZmFsc2UsIFsnZGVyaXZlS2V5J10pO1xyXG5cdFx0Y29uc3QgcHJpdmF0ZUtleSA9IGNyeXB0by5zdWJ0bGUuZGVyaXZlS2V5KFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZTogJ1BCS0RGMicsXHJcblx0XHRcdFx0aGFzaDoge25hbWU6ICdTSEEtMjU2J30sXHJcblx0XHRcdFx0aXRlcmF0aW9ucyxcclxuXHRcdFx0XHRzYWx0XHJcblx0XHRcdH0sXHJcblx0XHRcdGtleSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG5hbWU6ICdBRVMtR0NNJyxcclxuXHRcdFx0XHRsZW5ndGg6IDI1NlxyXG5cdFx0XHR9LFxyXG5cdFx0XHRmYWxzZSxcclxuXHRcdFx0WydlbmNyeXB0JywgJ2RlY3J5cHQnXVxyXG5cdFx0KTtcclxuXHRcdFxyXG5cdFx0cmV0dXJuIHByaXZhdGVLZXk7XHJcblx0fVxyXG5cclxuXHRwdWJsaWMgYXN5bmMgZW5jcnlwdFRvQmFzZTY0KHRleHQ6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XHJcblxyXG5cdFx0Y29uc3Qga2V5ID0gYXdhaXQgdGhpcy5kZXJpdmVLZXkocGFzc3dvcmQpO1xyXG5cdFx0XHJcblx0XHRjb25zdCB0ZXh0Qnl0ZXNUb0VuY3J5cHQgPSB1dGY4RW5jb2Rlci5lbmNvZGUodGV4dCk7XHJcblx0XHRjb25zdCB2ZWN0b3IgPSBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KHZlY3RvclNpemUpKTtcclxuXHRcdFxyXG5cdFx0Ly8gZW5jcnlwdCBpbnRvIGJ5dGVzXHJcblx0XHRjb25zdCBlbmNyeXB0ZWRCeXRlcyA9IG5ldyBVaW50OEFycmF5KFxyXG5cdFx0XHRhd2FpdCBjcnlwdG8uc3VidGxlLmVuY3J5cHQoXHJcblx0XHRcdFx0e25hbWU6ICdBRVMtR0NNJywgaXY6IHZlY3Rvcn0sXHJcblx0XHRcdFx0a2V5LFxyXG5cdFx0XHRcdHRleHRCeXRlc1RvRW5jcnlwdFxyXG5cdFx0XHQpXHJcblx0XHQpO1xyXG5cdFx0XHJcblx0XHRjb25zdCBmaW5hbEJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoIHZlY3Rvci5ieXRlTGVuZ3RoICsgZW5jcnlwdGVkQnl0ZXMuYnl0ZUxlbmd0aCApO1xyXG5cdFx0ZmluYWxCeXRlcy5zZXQoIHZlY3RvciwgMCApO1xyXG5cdFx0ZmluYWxCeXRlcy5zZXQoIGVuY3J5cHRlZEJ5dGVzLCB2ZWN0b3IuYnl0ZUxlbmd0aCApO1xyXG5cclxuXHRcdC8vY29udmVydCBhcnJheSB0byBiYXNlNjRcclxuXHRcdGNvbnN0IGJhc2U2NFRleHQgPSBidG9hKCBTdHJpbmcuZnJvbUNoYXJDb2RlKC4uLmZpbmFsQnl0ZXMpICk7XHJcblxyXG5cdFx0cmV0dXJuIGJhc2U2NFRleHQ7XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIHN0cmluZ1RvQXJyYXkoc3RyOiBzdHJpbmcpOiBVaW50OEFycmF5IHtcclxuXHRcdHZhciByZXN1bHQgPSBbXTtcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdHJlc3VsdC5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBuZXcgVWludDhBcnJheShyZXN1bHQpO1xyXG5cdH1cclxuXHJcblx0cHVibGljIGFzeW5jIGRlY3J5cHRGcm9tQmFzZTY0KGJhc2U2NEVuY29kZWQ6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XHJcblx0XHR0cnkge1xyXG5cclxuXHRcdFx0bGV0IGJ5dGVzVG9EZWNvZGUgPSB0aGlzLnN0cmluZ1RvQXJyYXkoYXRvYihiYXNlNjRFbmNvZGVkKSk7XHJcblx0XHRcdFxyXG5cdFx0XHQvLyBleHRyYWN0IGl2XHJcblx0XHRcdGNvbnN0IHZlY3RvciA9IGJ5dGVzVG9EZWNvZGUuc2xpY2UoMCx2ZWN0b3JTaXplKTtcclxuXHJcblx0XHRcdC8vIGV4dHJhY3QgZW5jcnlwdGVkIHRleHRcclxuXHRcdFx0Y29uc3QgZW5jcnlwdGVkVGV4dEJ5dGVzID0gYnl0ZXNUb0RlY29kZS5zbGljZSh2ZWN0b3JTaXplKTtcclxuXHJcblx0XHRcdGNvbnN0IGtleSA9IGF3YWl0IHRoaXMuZGVyaXZlS2V5KHBhc3N3b3JkKTtcclxuXHJcblx0XHRcdC8vIGRlY3J5cHQgaW50byBieXRlc1xyXG5cdFx0XHRsZXQgZGVjcnlwdGVkQnl0ZXMgPSBhd2FpdCBjcnlwdG8uc3VidGxlLmRlY3J5cHQoXHJcblx0XHRcdFx0e25hbWU6ICdBRVMtR0NNJywgaXY6IHZlY3Rvcn0sXHJcblx0XHRcdFx0a2V5LFxyXG5cdFx0XHRcdGVuY3J5cHRlZFRleHRCeXRlc1xyXG5cdFx0XHQpO1xyXG5cclxuXHRcdFx0Ly8gY29udmVydCBieXRlcyB0byB0ZXh0XHJcblx0XHRcdGxldCBkZWNyeXB0ZWRUZXh0ID0gdXRmOERlY29kZXIuZGVjb2RlKGRlY3J5cHRlZEJ5dGVzKTtcclxuXHRcdFx0cmV0dXJuIGRlY3J5cHRlZFRleHQ7XHJcblx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdC8vY29uc29sZS5lcnJvcihlKTtcclxuXHRcdFx0cmV0dXJuIG51bGw7XHJcblx0XHR9XHJcblx0fVxyXG5cclxufVxyXG5cclxuY29uc3QgYWxnb3JpdGhtT2Jzb2xldGUgPSB7XHJcblx0bmFtZTogJ0FFUy1HQ00nLFxyXG5cdGl2OiBuZXcgVWludDhBcnJheShbMTk2LCAxOTAsIDI0MCwgMTkwLCAxODgsIDc4LCA0MSwgMTMyLCAxNSwgMjIwLCA4NCwgMjExXSksXHJcblx0dGFnTGVuZ3RoOiAxMjhcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENyeXB0b0hlbHBlck9ic29sZXRlIHtcclxuXHJcblx0cHJpdmF0ZSBhc3luYyBidWlsZEtleShwYXNzd29yZDogc3RyaW5nKSB7XHJcblx0XHRsZXQgdXRmOEVuY29kZSA9IG5ldyBUZXh0RW5jb2RlcigpO1xyXG5cdFx0bGV0IHBhc3N3b3JkQnl0ZXMgPSB1dGY4RW5jb2RlLmVuY29kZShwYXNzd29yZCk7XHJcblxyXG5cdFx0bGV0IHBhc3N3b3JkRGlnZXN0ID0gYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoeyBuYW1lOiAnU0hBLTI1NicgfSwgcGFzc3dvcmRCeXRlcyk7XHJcblxyXG5cdFx0bGV0IGtleSA9IGF3YWl0IGNyeXB0by5zdWJ0bGUuaW1wb3J0S2V5KFxyXG5cdFx0XHQncmF3JyxcclxuXHRcdFx0cGFzc3dvcmREaWdlc3QsXHJcblx0XHRcdGFsZ29yaXRobU9ic29sZXRlLFxyXG5cdFx0XHRmYWxzZSxcclxuXHRcdFx0WydlbmNyeXB0JywgJ2RlY3J5cHQnXVxyXG5cdFx0KTtcclxuXHJcblx0XHRyZXR1cm4ga2V5O1xyXG5cdH1cclxuXHJcblx0cHVibGljIGFzeW5jIGVuY3J5cHRUb0Jhc2U2NCh0ZXh0OiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG5cdFx0bGV0IGtleSA9IGF3YWl0IHRoaXMuYnVpbGRLZXkocGFzc3dvcmQpO1xyXG5cclxuXHRcdGxldCB1dGY4RW5jb2RlID0gbmV3IFRleHRFbmNvZGVyKCk7XHJcblx0XHRsZXQgYnl0ZXNUb0VuY3J5cHQgPSB1dGY4RW5jb2RlLmVuY29kZSh0ZXh0KTtcclxuXHJcblx0XHQvLyBlbmNyeXB0IGludG8gYnl0ZXNcclxuXHRcdGxldCBlbmNyeXB0ZWRCeXRlcyA9IG5ldyBVaW50OEFycmF5KGF3YWl0IGNyeXB0by5zdWJ0bGUuZW5jcnlwdChcclxuXHRcdFx0YWxnb3JpdGhtT2Jzb2xldGUsIGtleSwgYnl0ZXNUb0VuY3J5cHRcclxuXHRcdCkpO1xyXG5cclxuXHRcdC8vY29udmVydCBhcnJheSB0byBiYXNlNjRcclxuXHRcdGxldCBiYXNlNjRUZXh0ID0gYnRvYShTdHJpbmcuZnJvbUNoYXJDb2RlKC4uLmVuY3J5cHRlZEJ5dGVzKSk7XHJcblxyXG5cdFx0cmV0dXJuIGJhc2U2NFRleHQ7XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIHN0cmluZ1RvQXJyYXkoc3RyOiBzdHJpbmcpOiBVaW50OEFycmF5IHtcclxuXHRcdHZhciByZXN1bHQgPSBbXTtcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdHJlc3VsdC5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpKTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBuZXcgVWludDhBcnJheShyZXN1bHQpO1xyXG5cdH1cclxuXHJcblx0cHVibGljIGFzeW5jIGRlY3J5cHRGcm9tQmFzZTY0KGJhc2U2NEVuY29kZWQ6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XHJcblx0XHR0cnkge1xyXG5cdFx0XHQvLyBjb252ZXJ0IGJhc2UgNjQgdG8gYXJyYXlcclxuXHRcdFx0bGV0IGJ5dGVzVG9EZWNyeXB0ID0gdGhpcy5zdHJpbmdUb0FycmF5KGF0b2IoYmFzZTY0RW5jb2RlZCkpO1xyXG5cclxuXHRcdFx0bGV0IGtleSA9IGF3YWl0IHRoaXMuYnVpbGRLZXkocGFzc3dvcmQpO1xyXG5cclxuXHRcdFx0Ly8gZGVjcnlwdCBpbnRvIGJ5dGVzXHJcblx0XHRcdGxldCBkZWNyeXB0ZWRCeXRlcyA9IGF3YWl0IGNyeXB0by5zdWJ0bGUuZGVjcnlwdChhbGdvcml0aG1PYnNvbGV0ZSwga2V5LCBieXRlc1RvRGVjcnlwdCk7XHJcblxyXG5cdFx0XHQvLyBjb252ZXJ0IGJ5dGVzIHRvIHRleHRcclxuXHRcdFx0bGV0IHV0ZjhEZWNvZGUgPSBuZXcgVGV4dERlY29kZXIoKTtcclxuXHRcdFx0bGV0IGRlY3J5cHRlZFRleHQgPSB1dGY4RGVjb2RlLmRlY29kZShkZWNyeXB0ZWRCeXRlcyk7XHJcblx0XHRcdHJldHVybiBkZWNyeXB0ZWRUZXh0O1xyXG5cdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG59XHJcbiIsImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgU2xpZGVyQ29tcG9uZW50IH0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCBNZWxkRW5jcnlwdCBmcm9tIFwiLi9tYWluXCI7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNZWxkRW5jcnlwdFNldHRpbmdzVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XHJcblx0cGx1Z2luOiBNZWxkRW5jcnlwdDtcclxuXHJcblx0cHdUaW1lb3V0U2V0dGluZzpTZXR0aW5nO1xyXG5cclxuXHRjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBNZWxkRW5jcnlwdCkge1xyXG5cdFx0c3VwZXIoYXBwLCBwbHVnaW4pO1xyXG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XHJcblx0fVxyXG5cclxuXHRkaXNwbGF5KCk6IHZvaWQge1xyXG5cdFx0bGV0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XHJcblxyXG5cdFx0Y29udGFpbmVyRWwuZW1wdHkoKTtcclxuXHRcdFxyXG5cdFx0Y29udGFpbmVyRWwuY3JlYXRlRWwoJ2gyJywge3RleHQ6ICdTZXR0aW5ncyBmb3IgTWVsZCBFbmNyeXB0J30pO1xyXG5cclxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG5cdFx0LnNldE5hbWUoJ0NvbmZpcm0gcGFzc3dvcmQ/JylcclxuXHRcdC5zZXREZXNjKCdDb25maXJtIHBhc3N3b3JkIHdoZW4gZW5jcnlwdGluZy4nKVxyXG5cdFx0LmFkZFRvZ2dsZSggdG9nZ2xlID0+e1xyXG5cdFx0XHR0b2dnbGVcclxuXHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuY29uZmlybVBhc3N3b3JkKVxyXG5cdFx0XHRcdC5vbkNoYW5nZSggYXN5bmMgdmFsdWUgPT57XHJcblx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5jb25maXJtUGFzc3dvcmQgPSB2YWx1ZTtcclxuXHRcdFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG5cdFx0XHRcdFx0dGhpcy51cGRhdGVTZXR0aW5nc1VpKCk7XHJcblx0XHRcdFx0fSlcclxuXHRcdH0pXHJcblx0O1xyXG5cclxuXHRcdG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG5cdFx0XHQuc2V0TmFtZSgnUmVtZW1iZXIgcGFzc3dvcmQ/JylcclxuXHRcdFx0LnNldERlc2MoJ1JlbWVtYmVyIHRoZSBsYXN0IHVzZWQgcGFzc3dvcmQgZm9yIHRoaXMgc2Vzc2lvbi4nKVxyXG5cdFx0XHQuYWRkVG9nZ2xlKCB0b2dnbGUgPT57XHJcblx0XHRcdFx0dG9nZ2xlXHJcblx0XHRcdFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MucmVtZW1iZXJQYXNzd29yZClcclxuXHRcdFx0XHRcdC5vbkNoYW5nZSggYXN5bmMgdmFsdWUgPT57XHJcblx0XHRcdFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLnJlbWVtYmVyUGFzc3dvcmQgPSB2YWx1ZTtcclxuXHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcblx0XHRcdFx0XHRcdHRoaXMudXBkYXRlU2V0dGluZ3NVaSgpO1xyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0fSlcclxuXHRcdDtcclxuXHJcblx0XHR0aGlzLnB3VGltZW91dFNldHRpbmcgPSBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuXHRcdFx0LnNldE5hbWUoIHRoaXMuYnVpbGRQYXNzd29yZFRpbWVvdXRTZXR0aW5nTmFtZSgpIClcclxuXHRcdFx0LnNldERlc2MoJ1RoZSBudW1iZXIgb2YgbWludXRlcyB0byByZW1lbWJlciB0aGUgbGFzdCB1c2VkIHBhc3N3b3JkLicpXHJcblx0XHRcdC5hZGRTbGlkZXIoIHNsaWRlciA9PiB7XHJcblx0XHRcdFx0c2xpZGVyXHJcblx0XHRcdFx0XHQuc2V0TGltaXRzKDAsIDEyMCwgNSlcclxuXHRcdFx0XHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZW1lbWJlclBhc3N3b3JkVGltZW91dClcclxuXHRcdFx0XHRcdC5vbkNoYW5nZSggYXN5bmMgdmFsdWUgPT4ge1xyXG5cdFx0XHRcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZW1lbWJlclBhc3N3b3JkVGltZW91dCA9IHZhbHVlO1xyXG5cdFx0XHRcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuXHRcdFx0XHRcdFx0dGhpcy51cGRhdGVTZXR0aW5nc1VpKCk7XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdDtcclxuXHRcdFx0XHRcclxuXHRcdFx0fSlcclxuXHRcdDtcclxuXHJcblx0XHR0aGlzLnVwZGF0ZVNldHRpbmdzVWkoKTtcclxuXHR9XHJcblxyXG5cdHVwZGF0ZVNldHRpbmdzVWkoKTp2b2lke1xyXG5cdFx0dGhpcy5wd1RpbWVvdXRTZXR0aW5nLnNldE5hbWUodGhpcy5idWlsZFBhc3N3b3JkVGltZW91dFNldHRpbmdOYW1lKCkpO1xyXG5cclxuXHRcdGlmICggdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVtZW1iZXJQYXNzd29yZCApe1xyXG5cdFx0XHR0aGlzLnB3VGltZW91dFNldHRpbmcuc2V0dGluZ0VsLnNob3coKTtcclxuXHRcdH1lbHNle1xyXG5cdFx0XHR0aGlzLnB3VGltZW91dFNldHRpbmcuc2V0dGluZ0VsLmhpZGUoKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGJ1aWxkUGFzc3dvcmRUaW1lb3V0U2V0dGluZ05hbWUoKTpzdHJpbmd7XHJcblx0XHRjb25zdCB2YWx1ZSA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnJlbWVtYmVyUGFzc3dvcmRUaW1lb3V0O1xyXG5cdFx0bGV0IHRpbWVvdXRTdHJpbmcgPSBgJHt2YWx1ZX0gbWludXRlc2A7XHJcblx0XHRpZih2YWx1ZSA9PSAwKXtcclxuXHRcdFx0dGltZW91dFN0cmluZyA9ICdOZXZlciBmb3JnZXQnO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIGBSZW1lbWJlciBQYXNzd29yZCBUaW1lb3V0ICgke3RpbWVvdXRTdHJpbmd9KWA7XHJcblx0fVxyXG59IiwiaW1wb3J0IHsgTm90aWNlLCBQbHVnaW4sIE1hcmtkb3duVmlldywgRWRpdG9yIH0gZnJvbSAnb2JzaWRpYW4nO1xyXG5pbXBvcnQgRGVjcnlwdE1vZGFsIGZyb20gJy4vRGVjcnlwdE1vZGFsJztcclxuaW1wb3J0IFBhc3N3b3JkTW9kYWwgZnJvbSAnLi9QYXNzd29yZE1vZGFsJztcclxuaW1wb3J0IHsgQ3J5cHRvSGVscGVyVjIsIENyeXB0b0hlbHBlck9ic29sZXRlfSBmcm9tICcuL0NyeXB0b0hlbHBlcic7XHJcbmltcG9ydCBNZWxkRW5jcnlwdFNldHRpbmdzVGFiIGZyb20gJy4vTWVsZEVuY3J5cHRTZXR0aW5nc1RhYic7XHJcblxyXG5jb25zdCBfUFJFRklYX09CU09MRVRFOiBzdHJpbmcgPSAnJSXwn5SQICc7XHJcbmNvbnN0IF9QUkVGSVhfQTogc3RyaW5nID0gJyUl8J+UkM6xICc7XHJcbmNvbnN0IF9TVUZGSVg6IHN0cmluZyA9ICcg8J+UkCUlJztcclxuXHJcbmludGVyZmFjZSBNZWxkRW5jcnlwdFBsdWdpblNldHRpbmdzIHtcclxuXHRjb25maXJtUGFzc3dvcmQ6IGJvb2xlYW47XHJcblx0cmVtZW1iZXJQYXNzd29yZDogYm9vbGVhbjtcclxuXHRyZW1lbWJlclBhc3N3b3JkVGltZW91dDogbnVtYmVyO1xyXG59XHJcblxyXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBNZWxkRW5jcnlwdFBsdWdpblNldHRpbmdzID0ge1xyXG5cdGNvbmZpcm1QYXNzd29yZDogdHJ1ZSxcclxuXHRyZW1lbWJlclBhc3N3b3JkOiB0cnVlLFxyXG5cdHJlbWVtYmVyUGFzc3dvcmRUaW1lb3V0OiAzMFxyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNZWxkRW5jcnlwdCBleHRlbmRzIFBsdWdpbiB7XHJcblxyXG5cdHNldHRpbmdzOiBNZWxkRW5jcnlwdFBsdWdpblNldHRpbmdzO1xyXG5cdHBhc3N3b3JkTGFzdFVzZWRFeHBpcnk6IG51bWJlclxyXG5cdHBhc3N3b3JkTGFzdFVzZWQ6IHN0cmluZztcclxuXHJcblx0YXN5bmMgb25sb2FkKCkge1xyXG5cclxuXHRcdGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XHJcblxyXG5cdFx0dGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBNZWxkRW5jcnlwdFNldHRpbmdzVGFiKHRoaXMuYXBwLCB0aGlzKSk7XHJcblxyXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcclxuXHRcdFx0aWQ6ICdlbmNyeXB0LWRlY3J5cHQnLFxyXG5cdFx0XHRuYW1lOiAnRW5jcnlwdC9EZWNyeXB0JyxcclxuXHRcdFx0Y2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB0aGlzLnByb2Nlc3NFbmNyeXB0RGVjcnlwdENvbW1hbmQoY2hlY2tpbmcsIGZhbHNlKVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcclxuXHRcdFx0aWQ6ICdlbmNyeXB0LWRlY3J5cHQtaW4tcGxhY2UnLFxyXG5cdFx0XHRuYW1lOiAnRW5jcnlwdC9EZWNyeXB0IEluLXBsYWNlJyxcclxuXHRcdFx0Y2hlY2tDYWxsYmFjazogKGNoZWNraW5nKSA9PiB0aGlzLnByb2Nlc3NFbmNyeXB0RGVjcnlwdENvbW1hbmQoY2hlY2tpbmcsIHRydWUpXHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcclxuXHRcdHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKHt9LCBERUZBVUxUX1NFVFRJTkdTLCBhd2FpdCB0aGlzLmxvYWREYXRhKCkpO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgc2F2ZVNldHRpbmdzKCkge1xyXG5cdFx0YXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcclxuXHR9XHJcblxyXG5cdHByb2Nlc3NFbmNyeXB0RGVjcnlwdENvbW1hbmQoY2hlY2tpbmc6IGJvb2xlYW4sIGRlY3J5cHRJblBsYWNlOiBib29sZWFuKTogYm9vbGVhbiB7XHJcblxyXG5cdFx0Y29uc3QgbWR2aWV3ID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcclxuXHRcdGlmICghbWR2aWV3KSB7XHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBlZGl0b3IgPSBtZHZpZXcuZWRpdG9yO1xyXG5cdFx0aWYgKCFlZGl0b3IpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNvbnN0IHN0YXJ0TGluZSA9IGVkaXRvci5nZXRDdXJzb3IoJ2Zyb20nKS5saW5lO1xyXG5cdFx0Y29uc3Qgc3RhcnRQb3MgPSB7IGxpbmU6IHN0YXJ0TGluZSwgY2g6IDAgfTsgLy8gd2FudCB0aGUgc3RhcnQgb2YgdGhlIGZpcnN0IGxpbmVcclxuXHJcblx0XHRjb25zdCBlbmRMaW5lID0gZWRpdG9yLmdldEN1cnNvcigndG8nKS5saW5lO1xyXG5cdFx0Y29uc3QgZW5kTGluZVRleHQgPSBlZGl0b3IuZ2V0TGluZShlbmRMaW5lKTtcclxuXHRcdGNvbnN0IGVuZFBvcyA9IHsgbGluZTogZW5kTGluZSwgY2g6IGVuZExpbmVUZXh0Lmxlbmd0aCB9OyAvLyB3YW50IHRoZSBlbmQgb2YgbGFzdCBsaW5lXHJcblxyXG5cdFx0Y29uc3Qgc2VsZWN0aW9uVGV4dCA9IGVkaXRvci5nZXRSYW5nZShzdGFydFBvcywgZW5kUG9zKTtcclxuXHJcblx0XHRpZiAoc2VsZWN0aW9uVGV4dC5sZW5ndGggPT0gMCkge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgZGVjcnlwdF9vYnMgPSBzZWxlY3Rpb25UZXh0LnN0YXJ0c1dpdGgoX1BSRUZJWF9PQlNPTEVURSkgJiYgc2VsZWN0aW9uVGV4dC5lbmRzV2l0aChfU1VGRklYKTtcclxuXHRcdGNvbnN0IGRlY3J5cHRfYSA9IHNlbGVjdGlvblRleHQuc3RhcnRzV2l0aChfUFJFRklYX0EpICYmIHNlbGVjdGlvblRleHQuZW5kc1dpdGgoX1NVRkZJWCk7XHJcblxyXG5cdFx0Y29uc3QgZGVjcnlwdCA9IGRlY3J5cHRfb2JzIHx8IGRlY3J5cHRfYTtcclxuXHRcdGNvbnN0IGVuY3J5cHQgPSAhc2VsZWN0aW9uVGV4dC5jb250YWlucyhfUFJFRklYX09CU09MRVRFKSAmJiAhc2VsZWN0aW9uVGV4dC5jb250YWlucyhfU1VGRklYKTtcclxuXHJcblx0XHRpZiAoIWRlY3J5cHQgJiYgIWVuY3J5cHQpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChjaGVja2luZykge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyBGZXRjaCBwYXNzd29yZCBmcm9tIHVzZXJcclxuXHJcblx0XHQvLyBkZXRlcm1pbmUgZGVmYXVsdCBwYXNzd29yZFxyXG5cdFx0Y29uc3QgaXNSZW1lbWJlclBhc3N3b3JkRXhwaXJlZCA9XHJcblx0XHRcdCF0aGlzLnNldHRpbmdzLnJlbWVtYmVyUGFzc3dvcmRcclxuXHRcdFx0fHwgKFxyXG5cdFx0XHRcdHRoaXMucGFzc3dvcmRMYXN0VXNlZEV4cGlyeSAhPSBudWxsXHJcblx0XHRcdFx0JiYgRGF0ZS5ub3coKSA+IHRoaXMucGFzc3dvcmRMYXN0VXNlZEV4cGlyeVxyXG5cdFx0XHQpXHJcblx0XHRcdDtcclxuXHJcblx0XHRjb25zdCBjb25maXJtUGFzc3dvcmQgPSBlbmNyeXB0ICYmIHRoaXMuc2V0dGluZ3MuY29uZmlybVBhc3N3b3JkO1xyXG5cclxuXHRcdGlmICggaXNSZW1lbWJlclBhc3N3b3JkRXhwaXJlZCB8fCBjb25maXJtUGFzc3dvcmQgKSB7XHJcblx0XHRcdC8vIGZvcmdldCBwYXNzd29yZFxyXG5cdFx0XHR0aGlzLnBhc3N3b3JkTGFzdFVzZWQgPSAnJztcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBwd01vZGFsID0gbmV3IFBhc3N3b3JkTW9kYWwodGhpcy5hcHAsIGNvbmZpcm1QYXNzd29yZCwgdGhpcy5wYXNzd29yZExhc3RVc2VkKTtcclxuXHRcdHB3TW9kYWwub25DbG9zZSA9ICgpID0+IHtcclxuXHRcdFx0Y29uc3QgcHcgPSBwd01vZGFsLnBhc3N3b3JkID8/ICcnXHJcblx0XHRcdGlmIChwdy5sZW5ndGggPT0gMCkge1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Ly8gcmVtZW1iZXIgcGFzc3dvcmQ/XHJcblx0XHRcdGlmICh0aGlzLnNldHRpbmdzLnJlbWVtYmVyUGFzc3dvcmQpIHtcclxuXHRcdFx0XHR0aGlzLnBhc3N3b3JkTGFzdFVzZWQgPSBwdztcclxuXHRcdFx0XHR0aGlzLnBhc3N3b3JkTGFzdFVzZWRFeHBpcnkgPVxyXG5cdFx0XHRcdFx0dGhpcy5zZXR0aW5ncy5yZW1lbWJlclBhc3N3b3JkVGltZW91dCA9PSAwXHJcblx0XHRcdFx0XHRcdD8gbnVsbFxyXG5cdFx0XHRcdFx0XHQ6IERhdGUubm93KCkgKyB0aGlzLnNldHRpbmdzLnJlbWVtYmVyUGFzc3dvcmRUaW1lb3V0ICogMTAwMCAqIDYwLy8gbmV3IGV4cGlyeVxyXG5cdFx0XHRcdFx0O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoZW5jcnlwdCkge1xyXG5cdFx0XHRcdHRoaXMuZW5jcnlwdFNlbGVjdGlvbihcclxuXHRcdFx0XHRcdGVkaXRvcixcclxuXHRcdFx0XHRcdHNlbGVjdGlvblRleHQsXHJcblx0XHRcdFx0XHRwdyxcclxuXHRcdFx0XHRcdHN0YXJ0UG9zLFxyXG5cdFx0XHRcdFx0ZW5kUG9zXHJcblx0XHRcdFx0KTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdFx0aWYgKGRlY3J5cHRfYSl7XHJcblx0XHRcdFx0XHR0aGlzLmRlY3J5cHRTZWxlY3Rpb25fYShcclxuXHRcdFx0XHRcdFx0ZWRpdG9yLFxyXG5cdFx0XHRcdFx0XHRzZWxlY3Rpb25UZXh0LFxyXG5cdFx0XHRcdFx0XHRwdyxcclxuXHRcdFx0XHRcdFx0c3RhcnRQb3MsXHJcblx0XHRcdFx0XHRcdGVuZFBvcyxcclxuXHRcdFx0XHRcdFx0ZGVjcnlwdEluUGxhY2VcclxuXHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0fWVsc2V7XHJcblx0XHRcdFx0XHR0aGlzLmRlY3J5cHRTZWxlY3Rpb25PYnNvbGV0ZShcclxuXHRcdFx0XHRcdFx0ZWRpdG9yLFxyXG5cdFx0XHRcdFx0XHRzZWxlY3Rpb25UZXh0LFxyXG5cdFx0XHRcdFx0XHRwdyxcclxuXHRcdFx0XHRcdFx0c3RhcnRQb3MsXHJcblx0XHRcdFx0XHRcdGVuZFBvcyxcclxuXHRcdFx0XHRcdFx0ZGVjcnlwdEluUGxhY2VcclxuXHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRwd01vZGFsLm9wZW4oKTtcclxuXHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblxyXG5cdHByaXZhdGUgYXN5bmMgZW5jcnlwdFNlbGVjdGlvbihcclxuXHRcdGVkaXRvcjogRWRpdG9yLFxyXG5cdFx0c2VsZWN0aW9uVGV4dDogc3RyaW5nLFxyXG5cdFx0cGFzc3dvcmQ6IHN0cmluZyxcclxuXHRcdGZpbmFsU2VsZWN0aW9uU3RhcnQ6IENvZGVNaXJyb3IuUG9zaXRpb24sXHJcblx0XHRmaW5hbFNlbGVjdGlvbkVuZDogQ29kZU1pcnJvci5Qb3NpdGlvbixcclxuXHQpIHtcclxuXHRcdC8vZW5jcnlwdFxyXG5cdFx0Y29uc3QgY3J5cHRvID0gbmV3IENyeXB0b0hlbHBlclYyKCk7XHJcblx0XHRjb25zdCBiYXNlNjRFbmNyeXB0ZWRUZXh0ID0gdGhpcy5hZGRNYXJrZXJzKGF3YWl0IGNyeXB0by5lbmNyeXB0VG9CYXNlNjQoc2VsZWN0aW9uVGV4dCwgcGFzc3dvcmQpKTtcclxuXHRcdGVkaXRvci5zZXRTZWxlY3Rpb24oZmluYWxTZWxlY3Rpb25TdGFydCwgZmluYWxTZWxlY3Rpb25FbmQpO1xyXG5cdFx0ZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24oYmFzZTY0RW5jcnlwdGVkVGV4dCk7XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIGFzeW5jIGRlY3J5cHRTZWxlY3Rpb25fYShcclxuXHRcdGVkaXRvcjogRWRpdG9yLFxyXG5cdFx0c2VsZWN0aW9uVGV4dDogc3RyaW5nLFxyXG5cdFx0cGFzc3dvcmQ6IHN0cmluZyxcclxuXHRcdHNlbGVjdGlvblN0YXJ0OiBDb2RlTWlycm9yLlBvc2l0aW9uLFxyXG5cdFx0c2VsZWN0aW9uRW5kOiBDb2RlTWlycm9yLlBvc2l0aW9uLFxyXG5cdFx0ZGVjcnlwdEluUGxhY2U6IGJvb2xlYW5cclxuXHQpIHtcclxuXHRcdC8vY29uc29sZS5sb2coJ2RlY3J5cHRTZWxlY3Rpb25fYScpO1xyXG5cdFx0Ly8gZGVjcnlwdFxyXG5cdFx0Y29uc3QgYmFzZTY0Q2lwaGVyVGV4dCA9IHRoaXMucmVtb3ZlTWFya2VycyhzZWxlY3Rpb25UZXh0KTtcclxuXHJcblx0XHRjb25zdCBjcnlwdG8gPSBuZXcgQ3J5cHRvSGVscGVyVjIoKTtcclxuXHRcdGNvbnN0IGRlY3J5cHRlZFRleHQgPSBhd2FpdCBjcnlwdG8uZGVjcnlwdEZyb21CYXNlNjQoYmFzZTY0Q2lwaGVyVGV4dCwgcGFzc3dvcmQpO1xyXG5cdFx0aWYgKGRlY3J5cHRlZFRleHQgPT09IG51bGwpIHtcclxuXHRcdFx0bmV3IE5vdGljZSgn4p2MIERlY3J5cHRpb24gZmFpbGVkIScpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdGlmIChkZWNyeXB0SW5QbGFjZSkge1xyXG5cdFx0XHRcdGVkaXRvci5zZXRTZWxlY3Rpb24oc2VsZWN0aW9uU3RhcnQsIHNlbGVjdGlvbkVuZCk7XHJcblx0XHRcdFx0ZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24oZGVjcnlwdGVkVGV4dCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y29uc3QgZGVjcnlwdE1vZGFsID0gbmV3IERlY3J5cHRNb2RhbCh0aGlzLmFwcCwgJ/CflJMnLCBkZWNyeXB0ZWRUZXh0KTtcclxuXHRcdFx0XHRkZWNyeXB0TW9kYWwub25DbG9zZSA9ICgpID0+IHtcclxuXHRcdFx0XHRcdGVkaXRvci5mb2N1cygpO1xyXG5cdFx0XHRcdFx0aWYgKGRlY3J5cHRNb2RhbC5kZWNyeXB0SW5QbGFjZSkge1xyXG5cdFx0XHRcdFx0XHRlZGl0b3Iuc2V0U2VsZWN0aW9uKHNlbGVjdGlvblN0YXJ0LCBzZWxlY3Rpb25FbmQpO1xyXG5cdFx0XHRcdFx0XHRlZGl0b3IucmVwbGFjZVNlbGVjdGlvbihkZWNyeXB0ZWRUZXh0KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGVjcnlwdE1vZGFsLm9wZW4oKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSBhc3luYyBkZWNyeXB0U2VsZWN0aW9uT2Jzb2xldGUoXHJcblx0XHRlZGl0b3I6IEVkaXRvcixcclxuXHRcdHNlbGVjdGlvblRleHQ6IHN0cmluZyxcclxuXHRcdHBhc3N3b3JkOiBzdHJpbmcsXHJcblx0XHRzZWxlY3Rpb25TdGFydDogQ29kZU1pcnJvci5Qb3NpdGlvbixcclxuXHRcdHNlbGVjdGlvbkVuZDogQ29kZU1pcnJvci5Qb3NpdGlvbixcclxuXHRcdGRlY3J5cHRJblBsYWNlOiBib29sZWFuXHJcblx0KSB7XHJcblx0XHQvL2NvbnNvbGUubG9nKCdkZWNyeXB0U2VsZWN0aW9uT2Jzb2xldGUnKTtcclxuXHRcdC8vIGRlY3J5cHRcclxuXHRcdGNvbnN0IGJhc2U2NENpcGhlclRleHQgPSB0aGlzLnJlbW92ZU1hcmtlcnMoc2VsZWN0aW9uVGV4dCk7XHJcblx0XHRjb25zdCBjcnlwdG8gPSBuZXcgQ3J5cHRvSGVscGVyT2Jzb2xldGUoKTtcclxuXHRcdGNvbnN0IGRlY3J5cHRlZFRleHQgPSBhd2FpdCBjcnlwdG8uZGVjcnlwdEZyb21CYXNlNjQoYmFzZTY0Q2lwaGVyVGV4dCwgcGFzc3dvcmQpO1xyXG5cdFx0aWYgKGRlY3J5cHRlZFRleHQgPT09IG51bGwpIHtcclxuXHRcdFx0bmV3IE5vdGljZSgn4p2MIERlY3J5cHRpb24gZmFpbGVkIScpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHJcblx0XHRcdGlmIChkZWNyeXB0SW5QbGFjZSkge1xyXG5cdFx0XHRcdGVkaXRvci5zZXRTZWxlY3Rpb24oc2VsZWN0aW9uU3RhcnQsIHNlbGVjdGlvbkVuZCk7XHJcblx0XHRcdFx0ZWRpdG9yLnJlcGxhY2VTZWxlY3Rpb24oZGVjcnlwdGVkVGV4dCk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y29uc3QgZGVjcnlwdE1vZGFsID0gbmV3IERlY3J5cHRNb2RhbCh0aGlzLmFwcCwgJ/CflJMnLCBkZWNyeXB0ZWRUZXh0KTtcclxuXHRcdFx0XHRkZWNyeXB0TW9kYWwub25DbG9zZSA9ICgpID0+IHtcclxuXHRcdFx0XHRcdGVkaXRvci5mb2N1cygpO1xyXG5cdFx0XHRcdFx0aWYgKGRlY3J5cHRNb2RhbC5kZWNyeXB0SW5QbGFjZSkge1xyXG5cdFx0XHRcdFx0XHRlZGl0b3Iuc2V0U2VsZWN0aW9uKHNlbGVjdGlvblN0YXJ0LCBzZWxlY3Rpb25FbmQpO1xyXG5cdFx0XHRcdFx0XHRlZGl0b3IucmVwbGFjZVNlbGVjdGlvbihkZWNyeXB0ZWRUZXh0KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZGVjcnlwdE1vZGFsLm9wZW4oKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cHJpdmF0ZSByZW1vdmVNYXJrZXJzKHRleHQ6IHN0cmluZyk6IHN0cmluZyB7XHJcblx0XHRpZiAodGV4dC5zdGFydHNXaXRoKF9QUkVGSVhfQSkgJiYgdGV4dC5lbmRzV2l0aChfU1VGRklYKSkge1xyXG5cdFx0XHRyZXR1cm4gdGV4dC5yZXBsYWNlKF9QUkVGSVhfQSwgJycpLnJlcGxhY2UoX1NVRkZJWCwgJycpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHRleHQuc3RhcnRzV2l0aChfUFJFRklYX09CU09MRVRFKSAmJiB0ZXh0LmVuZHNXaXRoKF9TVUZGSVgpKSB7XHJcblx0XHRcdHJldHVybiB0ZXh0LnJlcGxhY2UoX1BSRUZJWF9PQlNPTEVURSwgJycpLnJlcGxhY2UoX1NVRkZJWCwgJycpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRleHQ7XHJcblx0fVxyXG5cclxuXHRwcml2YXRlIGFkZE1hcmtlcnModGV4dDogc3RyaW5nKTogc3RyaW5nIHtcclxuXHRcdGlmICghdGV4dC5jb250YWlucyhfUFJFRklYX09CU09MRVRFKSAmJiAhdGV4dC5jb250YWlucyhfUFJFRklYX0EpICYmICF0ZXh0LmNvbnRhaW5zKF9TVUZGSVgpKSB7XHJcblx0XHRcdHJldHVybiBfUFJFRklYX0EuY29uY2F0KHRleHQsIF9TVUZGSVgpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRleHQ7XHJcblx0fVxyXG5cclxufVxyXG4iXSwibmFtZXMiOlsiTW9kYWwiLCJQbHVnaW5TZXR0aW5nVGFiIiwiU2V0dGluZyIsIlBsdWdpbiIsIk1hcmtkb3duVmlldyIsIk5vdGljZSJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUF1REE7QUFDTyxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDN0QsSUFBSSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7QUFDaEgsSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDL0QsUUFBUSxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO0FBQ25HLFFBQVEsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO0FBQ3RHLFFBQVEsU0FBUyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQyxFQUFFO0FBQ3RILFFBQVEsSUFBSSxDQUFDLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFVBQVUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQzlFLEtBQUssQ0FBQyxDQUFDO0FBQ1A7O01DM0VxQixZQUFhLFNBQVFBLGNBQUs7SUFJOUMsWUFBWSxHQUFRLEVBQUUsS0FBYSxFQUFFLE9BQWUsRUFBRTtRQUNyRCxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFIWixtQkFBYyxHQUFZLEtBQUssQ0FBQztRQUkvQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7S0FDL0I7SUFFRCxNQUFNO1FBQ0wsSUFBSSxFQUFFLFNBQVMsRUFBRSxHQUFHLElBQUksQ0FBQztRQUV6QixNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUMvRSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7UUFDNUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLE1BQU0sQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDOztRQUV2QixVQUFVLENBQUMsUUFBUSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUEsRUFBRSxFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBR3pDLE1BQU0sY0FBYyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFL0MsTUFBTSxtQkFBbUIsR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxDQUFDLENBQUM7UUFDNUYsbUJBQW1CLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFO1lBQzdDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1lBQzNCLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNiLENBQUMsQ0FBQztRQUVILE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDekUsV0FBVyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRTtZQUNyQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDYixDQUFDLENBQUM7S0FFSDs7O01DbkNtQixhQUFjLFNBQVFBLGNBQUs7SUFLL0MsWUFBWSxHQUFRLEVBQUUsZUFBd0IsRUFBRSxrQkFBMEIsSUFBSTtRQUM3RSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFMWixhQUFRLEdBQVcsSUFBSSxDQUFDO1FBQ3hCLG9CQUFlLEdBQVcsSUFBSSxDQUFDO1FBSzlCLElBQUksQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxlQUFlLEdBQUcsZUFBZSxDQUFDO0tBQ3ZDO0lBRUQsTUFBTTs7UUFDTCxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBRXpCLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUVsQixNQUFNLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNqRCxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUUvQyxNQUFNLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFLLFFBQUUsSUFBSSxDQUFDLGVBQWUsbUNBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztRQUNoSCxTQUFTLENBQUMsV0FBVyxHQUFHLHFCQUFxQixDQUFDO1FBQzlDLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUM5QixTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFbEIsTUFBTSxtQkFBbUIsR0FBRyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDakYsbUJBQW1CLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7UUFDN0MsbUJBQW1CLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7UUFDN0MsbUJBQW1CLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDeEMsbUJBQW1CLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRTtZQUNoRCxvQkFBb0IsRUFBRSxDQUFDO1NBQ3ZCLENBQUMsQ0FBQztRQUdILE1BQU0sb0JBQW9CLEdBQUcsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ25ELG9CQUFvQixDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO1FBQzdDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBRWpELE1BQU0sZ0JBQWdCLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsS0FBSyxRQUFFLElBQUksQ0FBQyxlQUFlLG1DQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDekgsZ0JBQWdCLENBQUMsV0FBVyxHQUFHLHVCQUF1QixDQUFDO1FBQ3ZELGdCQUFnQixDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBRXJDLE1BQU0scUJBQXFCLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3JGLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDO1FBQy9DLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1FBQy9DLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQzFDLHFCQUFxQixDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUU7WUFDbEQsc0JBQXNCLEVBQUUsQ0FBQztTQUN6QixDQUFDLENBQUM7UUFFSCxNQUFNLG9CQUFvQixHQUFHO1lBQzVCLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTs7Z0JBRXpCLGdCQUFnQixDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ3pCO2lCQUFNO2dCQUNOLElBQUksQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztnQkFDaEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2I7U0FDRCxDQUFBO1FBRUQsTUFBTSxzQkFBc0IsR0FBRztZQUM5QixJQUFJLFNBQVMsQ0FBQyxLQUFLLElBQUksZ0JBQWdCLENBQUMsS0FBSyxFQUFDO2dCQUM3QyxJQUFJLENBQUMsUUFBUSxHQUFHLGdCQUFnQixDQUFDLEtBQUssQ0FBQztnQkFDdkMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2I7aUJBQUk7O2dCQUVKLFNBQVMsQ0FBQyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQztnQkFDNUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO2FBQ2pCO1NBQ0QsQ0FBQTtRQUdELGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUU7WUFDaEQsSUFDQyxDQUFFLEVBQUUsQ0FBQyxJQUFJLEtBQUssT0FBTyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEtBQUssYUFBYTttQkFDL0MsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQ25DO2dCQUNELEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDcEIsc0JBQXNCLEVBQUUsQ0FBQzthQUN6QjtTQUNELENBQUMsQ0FBQztRQUdILElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQzFCLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDO1NBQzVCO1FBRUQsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3hDLFNBQVMsQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUNsQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFakIsU0FBUyxDQUFDLGdCQUFnQixDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUU7WUFDekMsSUFDQyxDQUFFLEVBQUUsQ0FBQyxJQUFJLEtBQUssT0FBTyxJQUFJLEVBQUUsQ0FBQyxJQUFJLEtBQUssYUFBYTttQkFDL0MsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUM1QjtnQkFDRCxFQUFFLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ3BCLG9CQUFvQixFQUFFLENBQUM7YUFDdkI7U0FDRCxDQUFDLENBQUM7Ozs7Ozs7Ozs7OztLQWlCSDs7O0FDckhGLE1BQU0sVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUN0QixNQUFNLFdBQVcsR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0FBQ3RDLE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7QUFDdEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLE1BQU0sSUFBSSxHQUFLLFdBQVcsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztNQUV6QyxjQUFjO0lBRVosU0FBUyxDQUFDLFFBQWU7O1lBQ3RDLE1BQU0sTUFBTSxHQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDaEQsTUFBTSxHQUFHLEdBQVUsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQyxFQUFFLEtBQUssRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDeEcsTUFBTSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQ3pDO2dCQUNDLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7Z0JBQ3ZCLFVBQVU7Z0JBQ1YsSUFBSTthQUNKLEVBQ0QsR0FBRyxFQUNIO2dCQUNDLElBQUksRUFBRSxTQUFTO2dCQUNmLE1BQU0sRUFBRSxHQUFHO2FBQ1gsRUFDRCxLQUFLLEVBQ0wsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQ3RCLENBQUM7WUFFRixPQUFPLFVBQVUsQ0FBQztTQUNsQjtLQUFBO0lBRVksZUFBZSxDQUFDLElBQVksRUFBRSxRQUFnQjs7WUFFMUQsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTNDLE1BQU0sa0JBQWtCLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRCxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7O1lBR2xFLE1BQU0sY0FBYyxHQUFHLElBQUksVUFBVSxDQUNwQyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUMxQixFQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBQyxFQUM3QixHQUFHLEVBQ0gsa0JBQWtCLENBQ2xCLENBQ0QsQ0FBQztZQUVGLE1BQU0sVUFBVSxHQUFHLElBQUksVUFBVSxDQUFFLE1BQU0sQ0FBQyxVQUFVLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBRSxDQUFDO1lBQ25GLFVBQVUsQ0FBQyxHQUFHLENBQUUsTUFBTSxFQUFFLENBQUMsQ0FBRSxDQUFDO1lBQzVCLFVBQVUsQ0FBQyxHQUFHLENBQUUsY0FBYyxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUUsQ0FBQzs7WUFHcEQsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBRSxDQUFDO1lBRTlELE9BQU8sVUFBVSxDQUFDO1NBQ2xCO0tBQUE7SUFFTyxhQUFhLENBQUMsR0FBVztRQUNoQyxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDcEMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDL0I7UUFDRCxPQUFPLElBQUksVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQzlCO0lBRVksaUJBQWlCLENBQUMsYUFBcUIsRUFBRSxRQUFnQjs7WUFDckUsSUFBSTtnQkFFSCxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDOztnQkFHNUQsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUMsVUFBVSxDQUFDLENBQUM7O2dCQUdqRCxNQUFNLGtCQUFrQixHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBRTNELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7Z0JBRzNDLElBQUksY0FBYyxHQUFHLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQy9DLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFDLEVBQzdCLEdBQUcsRUFDSCxrQkFBa0IsQ0FDbEIsQ0FBQzs7Z0JBR0YsSUFBSSxhQUFhLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDdkQsT0FBTyxhQUFhLENBQUM7YUFDckI7WUFBQyxPQUFPLENBQUMsRUFBRTs7Z0JBRVgsT0FBTyxJQUFJLENBQUM7YUFDWjtTQUNEO0tBQUE7Q0FFRDtBQUVELE1BQU0saUJBQWlCLEdBQUc7SUFDekIsSUFBSSxFQUFFLFNBQVM7SUFDZixFQUFFLEVBQUUsSUFBSSxVQUFVLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzVFLFNBQVMsRUFBRSxHQUFHO0NBQ2QsQ0FBQTtNQUVZLG9CQUFvQjtJQUVsQixRQUFRLENBQUMsUUFBZ0I7O1lBQ3RDLElBQUksVUFBVSxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7WUFDbkMsSUFBSSxhQUFhLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVoRCxJQUFJLGNBQWMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBRXBGLElBQUksR0FBRyxHQUFHLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQ3RDLEtBQUssRUFDTCxjQUFjLEVBQ2QsaUJBQWlCLEVBQ2pCLEtBQUssRUFDTCxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FDdEIsQ0FBQztZQUVGLE9BQU8sR0FBRyxDQUFDO1NBQ1g7S0FBQTtJQUVZLGVBQWUsQ0FBQyxJQUFZLEVBQUUsUUFBZ0I7O1lBQzFELElBQUksR0FBRyxHQUFHLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUV4QyxJQUFJLFVBQVUsR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO1lBQ25DLElBQUksY0FBYyxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7O1lBRzdDLElBQUksY0FBYyxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQzlELGlCQUFpQixFQUFFLEdBQUcsRUFBRSxjQUFjLENBQ3RDLENBQUMsQ0FBQzs7WUFHSCxJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUM7WUFFOUQsT0FBTyxVQUFVLENBQUM7U0FDbEI7S0FBQTtJQUVPLGFBQWEsQ0FBQyxHQUFXO1FBQ2hDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNwQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUMvQjtRQUNELE9BQU8sSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDOUI7SUFFWSxpQkFBaUIsQ0FBQyxhQUFxQixFQUFFLFFBQWdCOztZQUNyRSxJQUFJOztnQkFFSCxJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUU3RCxJQUFJLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7O2dCQUd4QyxJQUFJLGNBQWMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRSxjQUFjLENBQUMsQ0FBQzs7Z0JBR3pGLElBQUksVUFBVSxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7Z0JBQ25DLElBQUksYUFBYSxHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ3RELE9BQU8sYUFBYSxDQUFDO2FBQ3JCO1lBQUMsT0FBTyxDQUFDLEVBQUU7Z0JBQ1gsT0FBTyxJQUFJLENBQUM7YUFDWjtTQUNEO0tBQUE7OztNQy9KbUIsc0JBQXVCLFNBQVFDLHlCQUFnQjtJQUtuRSxZQUFZLEdBQVEsRUFBRSxNQUFtQjtRQUN4QyxLQUFLLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0tBQ3JCO0lBRUQsT0FBTztRQUNOLElBQUksRUFBRSxXQUFXLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFFM0IsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRXBCLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUMsSUFBSSxFQUFFLDJCQUEyQixFQUFDLENBQUMsQ0FBQztRQUVoRSxJQUFJQyxnQkFBTyxDQUFDLFdBQVcsQ0FBQzthQUN2QixPQUFPLENBQUMsbUJBQW1CLENBQUM7YUFDNUIsT0FBTyxDQUFDLG1DQUFtQyxDQUFDO2FBQzVDLFNBQVMsQ0FBRSxNQUFNO1lBQ2pCLE1BQU07aUJBQ0osUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQztpQkFDOUMsUUFBUSxDQUFFLENBQU0sS0FBSztnQkFDckIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztnQkFDN0MsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzthQUN4QixDQUFBLENBQUMsQ0FBQTtTQUNILENBQUMsQ0FDRjtRQUVBLElBQUlBLGdCQUFPLENBQUMsV0FBVyxDQUFDO2FBQ3RCLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQzthQUM3QixPQUFPLENBQUMsbURBQW1ELENBQUM7YUFDNUQsU0FBUyxDQUFFLE1BQU07WUFDakIsTUFBTTtpQkFDSixRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7aUJBQy9DLFFBQVEsQ0FBRSxDQUFNLEtBQUs7Z0JBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztnQkFDOUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzthQUN4QixDQUFBLENBQUMsQ0FBQTtTQUNILENBQUMsQ0FDRjtRQUVELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJQSxnQkFBTyxDQUFDLFdBQVcsQ0FBQzthQUM5QyxPQUFPLENBQUUsSUFBSSxDQUFDLCtCQUErQixFQUFFLENBQUU7YUFDakQsT0FBTyxDQUFDLDJEQUEyRCxDQUFDO2FBQ3BFLFNBQVMsQ0FBRSxNQUFNO1lBQ2pCLE1BQU07aUJBQ0osU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2lCQUNwQixRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsdUJBQXVCLENBQUM7aUJBQ3RELFFBQVEsQ0FBRSxDQUFNLEtBQUs7Z0JBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztnQkFDckQsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzthQUN4QixDQUFBLENBQUMsQ0FDRjtTQUVELENBQUMsQ0FDRjtRQUVELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0tBQ3hCO0lBRUQsZ0JBQWdCO1FBQ2YsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsK0JBQStCLEVBQUUsQ0FBQyxDQUFDO1FBRXRFLElBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEVBQUU7WUFDM0MsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUN2QzthQUFJO1lBQ0osSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUN2QztLQUNEO0lBRUQsK0JBQStCO1FBQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLHVCQUF1QixDQUFDO1FBQzNELElBQUksYUFBYSxHQUFHLEdBQUcsS0FBSyxVQUFVLENBQUM7UUFDdkMsSUFBRyxLQUFLLElBQUksQ0FBQyxFQUFDO1lBQ2IsYUFBYSxHQUFHLGNBQWMsQ0FBQztTQUMvQjtRQUNELE9BQU8sOEJBQThCLGFBQWEsR0FBRyxDQUFDO0tBQ3REOzs7QUMvRUYsTUFBTSxnQkFBZ0IsR0FBVyxPQUFPLENBQUM7QUFDekMsTUFBTSxTQUFTLEdBQVcsUUFBUSxDQUFDO0FBQ25DLE1BQU0sT0FBTyxHQUFXLE9BQU8sQ0FBQztBQVFoQyxNQUFNLGdCQUFnQixHQUE4QjtJQUNuRCxlQUFlLEVBQUUsSUFBSTtJQUNyQixnQkFBZ0IsRUFBRSxJQUFJO0lBQ3RCLHVCQUF1QixFQUFFLEVBQUU7Q0FDM0IsQ0FBQTtNQUVvQixXQUFZLFNBQVFDLGVBQU07SUFNeEMsTUFBTTs7WUFFWCxNQUFNLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUUxQixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksc0JBQXNCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRS9ELElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBQ2YsRUFBRSxFQUFFLGlCQUFpQjtnQkFDckIsSUFBSSxFQUFFLGlCQUFpQjtnQkFDdkIsYUFBYSxFQUFFLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDO2FBQy9FLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxVQUFVLENBQUM7Z0JBQ2YsRUFBRSxFQUFFLDBCQUEwQjtnQkFDOUIsSUFBSSxFQUFFLDBCQUEwQjtnQkFDaEMsYUFBYSxFQUFFLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDO2FBQzlFLENBQUMsQ0FBQztTQUNIO0tBQUE7SUFFSyxZQUFZOztZQUNqQixJQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLGdCQUFnQixFQUFFLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7U0FDM0U7S0FBQTtJQUVLLFlBQVk7O1lBQ2pCLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDbkM7S0FBQTtJQUVELDRCQUE0QixDQUFDLFFBQWlCLEVBQUUsY0FBdUI7UUFFdEUsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUNDLHFCQUFZLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1osT0FBTyxLQUFLLENBQUM7U0FDYjtRQUVELE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDN0IsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNaLE9BQU8sS0FBSyxDQUFDO1NBQ2I7UUFFRCxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNoRCxNQUFNLFFBQVEsR0FBRyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBRTVDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzVDLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDNUMsTUFBTSxNQUFNLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFekQsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFeEQsSUFBSSxhQUFhLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtZQUM5QixPQUFPLEtBQUssQ0FBQztTQUNiO1FBRUQsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEcsTUFBTSxTQUFTLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXpGLE1BQU0sT0FBTyxHQUFHLFdBQVcsSUFBSSxTQUFTLENBQUM7UUFDekMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRTlGLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDekIsT0FBTyxLQUFLLENBQUM7U0FDYjtRQUVELElBQUksUUFBUSxFQUFFO1lBQ2IsT0FBTyxJQUFJLENBQUM7U0FDWjs7O1FBS0QsTUFBTSx5QkFBeUIsR0FDOUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQjtnQkFFOUIsSUFBSSxDQUFDLHNCQUFzQixJQUFJLElBQUk7bUJBQ2hDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQzNDLENBQ0E7UUFFRixNQUFNLGVBQWUsR0FBRyxPQUFPLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUM7UUFFakUsSUFBSyx5QkFBeUIsSUFBSSxlQUFlLEVBQUc7O1lBRW5ELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7U0FDM0I7UUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUNwRixPQUFPLENBQUMsT0FBTyxHQUFHOztZQUNqQixNQUFNLEVBQUUsU0FBRyxPQUFPLENBQUMsUUFBUSxtQ0FBSSxFQUFFLENBQUE7WUFDakMsSUFBSSxFQUFFLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtnQkFDbkIsT0FBTzthQUNQOztZQUdELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDbkMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLHNCQUFzQjtvQkFDMUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyx1QkFBdUIsSUFBSSxDQUFDOzBCQUN2QyxJQUFJOzBCQUNKLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLHVCQUF1QixHQUFHLElBQUksR0FBRyxFQUFFO2lCQUNoRTthQUNGO1lBRUQsSUFBSSxPQUFPLEVBQUU7Z0JBQ1osSUFBSSxDQUFDLGdCQUFnQixDQUNwQixNQUFNLEVBQ04sYUFBYSxFQUNiLEVBQUUsRUFDRixRQUFRLEVBQ1IsTUFBTSxDQUNOLENBQUM7YUFDRjtpQkFBTTtnQkFFTixJQUFJLFNBQVMsRUFBQztvQkFDYixJQUFJLENBQUMsa0JBQWtCLENBQ3RCLE1BQU0sRUFDTixhQUFhLEVBQ2IsRUFBRSxFQUNGLFFBQVEsRUFDUixNQUFNLEVBQ04sY0FBYyxDQUNkLENBQUM7aUJBQ0Y7cUJBQUk7b0JBQ0osSUFBSSxDQUFDLHdCQUF3QixDQUM1QixNQUFNLEVBQ04sYUFBYSxFQUNiLEVBQUUsRUFDRixRQUFRLEVBQ1IsTUFBTSxFQUNOLGNBQWMsQ0FDZCxDQUFDO2lCQUNGO2FBQ0Q7U0FDRCxDQUFBO1FBQ0QsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBRWYsT0FBTyxJQUFJLENBQUM7S0FDWjtJQUVhLGdCQUFnQixDQUM3QixNQUFjLEVBQ2QsYUFBcUIsRUFDckIsUUFBZ0IsRUFDaEIsbUJBQXdDLEVBQ3hDLGlCQUFzQzs7O1lBR3RDLE1BQU0sTUFBTSxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7WUFDcEMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sTUFBTSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztZQUNuRyxNQUFNLENBQUMsWUFBWSxDQUFDLG1CQUFtQixFQUFFLGlCQUFpQixDQUFDLENBQUM7WUFDNUQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLENBQUM7U0FDN0M7S0FBQTtJQUVhLGtCQUFrQixDQUMvQixNQUFjLEVBQ2QsYUFBcUIsRUFDckIsUUFBZ0IsRUFDaEIsY0FBbUMsRUFDbkMsWUFBaUMsRUFDakMsY0FBdUI7Ozs7WUFJdkIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRTNELE1BQU0sTUFBTSxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7WUFDcEMsTUFBTSxhQUFhLEdBQUcsTUFBTSxNQUFNLENBQUMsaUJBQWlCLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDakYsSUFBSSxhQUFhLEtBQUssSUFBSSxFQUFFO2dCQUMzQixJQUFJQyxlQUFNLENBQUMsc0JBQXNCLENBQUMsQ0FBQzthQUNuQztpQkFBTTtnQkFFTixJQUFJLGNBQWMsRUFBRTtvQkFDbkIsTUFBTSxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7b0JBQ2xELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztpQkFDdkM7cUJBQU07b0JBQ04sTUFBTSxZQUFZLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7b0JBQ3JFLFlBQVksQ0FBQyxPQUFPLEdBQUc7d0JBQ3RCLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDZixJQUFJLFlBQVksQ0FBQyxjQUFjLEVBQUU7NEJBQ2hDLE1BQU0sQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDOzRCQUNsRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLENBQUM7eUJBQ3ZDO3FCQUNELENBQUE7b0JBQ0QsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO2lCQUNwQjthQUNEO1NBQ0Q7S0FBQTtJQUVhLHdCQUF3QixDQUNyQyxNQUFjLEVBQ2QsYUFBcUIsRUFDckIsUUFBZ0IsRUFDaEIsY0FBbUMsRUFDbkMsWUFBaUMsRUFDakMsY0FBdUI7Ozs7WUFJdkIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQzNELE1BQU0sTUFBTSxHQUFHLElBQUksb0JBQW9CLEVBQUUsQ0FBQztZQUMxQyxNQUFNLGFBQWEsR0FBRyxNQUFNLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUNqRixJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUU7Z0JBQzNCLElBQUlBLGVBQU0sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2FBQ25DO2lCQUFNO2dCQUVOLElBQUksY0FBYyxFQUFFO29CQUNuQixNQUFNLENBQUMsWUFBWSxDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztvQkFDbEQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDO2lCQUN2QztxQkFBTTtvQkFDTixNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztvQkFDckUsWUFBWSxDQUFDLE9BQU8sR0FBRzt3QkFDdEIsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO3dCQUNmLElBQUksWUFBWSxDQUFDLGNBQWMsRUFBRTs0QkFDaEMsTUFBTSxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7NEJBQ2xELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQzt5QkFDdkM7cUJBQ0QsQ0FBQTtvQkFDRCxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7aUJBQ3BCO2FBQ0Q7U0FDRDtLQUFBO0lBRU8sYUFBYSxDQUFDLElBQVk7UUFDakMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDekQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ3hEO1FBQ0QsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUNoRSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztTQUMvRDtRQUNELE9BQU8sSUFBSSxDQUFDO0tBQ1o7SUFFTyxVQUFVLENBQUMsSUFBWTtRQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDN0YsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN2QztRQUNELE9BQU8sSUFBSSxDQUFDO0tBQ1o7Ozs7OyJ9
