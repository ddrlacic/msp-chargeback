export function installDialogPolyfill(): void {
  const prototype = HTMLDialogElement.prototype;
  if (typeof prototype.showModal === 'function') {
    return;
  }
  prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  prototype.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) {
      return;
    }
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
