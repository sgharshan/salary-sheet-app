import '@testing-library/jest-dom'

// jsdom does not implement native dialog methods. Keep its open state realistic;
// component tests still exercise our focus, dismissal, and scroll-lock handling.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
}
