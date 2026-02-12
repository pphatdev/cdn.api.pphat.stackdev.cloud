type Placement = string;

type PopperOptions = {
    placement?: Placement;
    modifiers?: Array<{ name: string; options?: Record<string, unknown> } | Record<string, unknown>>;
};

type PopperInstance = {
    setOptions: (updater: (options: Record<string, unknown>) => Record<string, unknown>) => void;
    update: () => void;
};

type CreatePopperFn = (reference: Element, popper: HTMLElement, options: PopperOptions) => PopperInstance;

type DropdownOptions = {
    placement?: Placement;
    triggerType?: 'click';
    onShow?: (instance: Dropdown) => void;
    onHide?: (instance: Dropdown) => void;
};

const Default: Required<DropdownOptions> = {
    placement: 'bottom',
    triggerType: 'click',
    onShow: () => { },
    onHide: () => { }
};

export class Dropdown {
    private _targetEl: HTMLElement | null;
    private _triggerEl: HTMLElement | null;
    private _options: Required<DropdownOptions>;
    private _popperInstance: PopperInstance | null;
    private _visible = false;
    private _handleDocumentClick: (ev: MouseEvent) => void;
    private _handleTriggerClick: (ev: MouseEvent) => void;
    private _createPopper: CreatePopperFn | null;

    constructor(targetElement: HTMLElement | null = null, triggerElement: HTMLElement | null = null, options: DropdownOptions = {}, createPopper: CreatePopperFn | null = null) {
        this._targetEl = targetElement;
        this._triggerEl = triggerElement;
        this._options = { ...Default, ...options };
        this._createPopper = createPopper;
        this._popperInstance = this.createPopperInstance();
        this._handleDocumentClick = this.handleClickOutside.bind(this);
        this._handleTriggerClick = this.handleTriggerClick.bind(this);
        this.init();
    }

    init(): void {
        if (this._triggerEl) {
            this._triggerEl.addEventListener('click', this._handleTriggerClick);
        }
    }

    private handleTriggerClick(event: MouseEvent): void {
        event.preventDefault();
        this.toggle();
    }

    private createPopperInstance(): PopperInstance | null {
        if (!this._triggerEl || !this._targetEl || !this._createPopper) {
            return null;
        }

        return this._createPopper(this._triggerEl, this._targetEl, {
            placement: this._options.placement,
            modifiers: [
                {
                    name: 'offset',
                    options: {
                        offset: [0, 10],
                    },
                },
            ],
        });
    }

    private handleClickOutside(ev: MouseEvent): void {
        if (!this._targetEl || !this._triggerEl) {
            return;
        }

        const clickedEl = ev.target as Node | null;
        if (clickedEl && clickedEl !== this._targetEl && !this._targetEl.contains(clickedEl) && !this._triggerEl.contains(clickedEl) && this._visible) {
            this.hide();
        }
        this.detachOutsideClick();
    }

    private attachOutsideClick(): void {
        document.body.addEventListener('click', this._handleDocumentClick, true);
    }

    private detachOutsideClick(): void {
        document.body.removeEventListener('click', this._handleDocumentClick, true);
    }

    toggle(): void {
        if (this._visible) {
            this.hide();
            return;
        }
        this.show();
    }

    show(): void {
        if (!this._targetEl || !this._popperInstance) {
            return;
        }

        this._targetEl.classList.remove('hidden');
        this._targetEl.classList.add('block');
        if (this._triggerEl) {
            this._triggerEl.setAttribute('aria-expanded', 'true');
        }

        this._popperInstance.setOptions(options => {
            const modifiers = Array.isArray(options.modifiers) ? options.modifiers : [];
            return {
                ...options,
                modifiers: [
                    ...modifiers,
                    { name: 'eventListeners', enabled: true },
                ],
            };
        });

        this.attachOutsideClick();

        this._popperInstance.update();
        this._visible = true;

        this._options.onShow(this);
    }

    hide(): void {
        if (!this._targetEl || !this._popperInstance) {
            return;
        }

        this._targetEl.classList.remove('block');
        this._targetEl.classList.add('hidden');
        if (this._triggerEl) {
            this._triggerEl.setAttribute('aria-expanded', 'false');
        }

        this._popperInstance.setOptions(options => {
            const modifiers = Array.isArray(options.modifiers) ? options.modifiers : [];
            return {
                ...options,
                modifiers: [
                    ...modifiers,
                    { name: 'eventListeners', enabled: false },
                ],
            };
        });

        this._visible = false;
        this.detachOutsideClick();

        this._options.onHide(this);
    }
}

declare global {
    interface Window {
        Dropdown: typeof Dropdown;
    }
}

window.Dropdown = Dropdown;

const initDropdowns = (): void => {
    const popper = (window as unknown as { Popper?: { createPopper?: CreatePopperFn } }).Popper;
    const createPopper = popper?.createPopper ?? null;

    document.querySelectorAll<HTMLElement>('[data-dropdown-toggle]').forEach(triggerEl => {
        const targetId = triggerEl.getAttribute('data-dropdown-toggle');
        if (!targetId) {
            return;
        }

        const targetEl = document.getElementById(targetId);
        if (!targetEl) {
            return;
        }

        const placement = triggerEl.getAttribute('data-dropdown-placement') as Placement | null;
        new Dropdown(targetEl, triggerEl, {
            placement: placement ?? Default.placement
        }, createPopper);
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDropdowns);
} else {
    initDropdowns();
}

export default Dropdown;
