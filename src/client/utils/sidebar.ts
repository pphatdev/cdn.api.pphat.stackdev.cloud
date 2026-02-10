type SidebarControllerOptions = {
	rootSelector?: string;
	toggleSelector?: string;
	closeSelector?: string;
	overlaySelector?: string;
	openClass?: string;
	bodyOpenClass?: string;
	responsiveBreakpoint?: string;
};

export class SidebarController {
	private root: HTMLElement | null = null;
	private overlay: HTMLElement | null = null;
	private toggles: HTMLElement[] = [];
	private closes: HTMLElement[] = [];
	private options: Required<SidebarControllerOptions>;
	private readonly openSidebarClasses = ['translate-x-0'];
	private readonly closedSidebarClasses = ['-translate-x-full'];
	private readonly openOverlayClasses = ['opacity-100', 'pointer-events-auto'];
	private readonly closedOverlayClasses = ['opacity-0', 'pointer-events-none'];

	constructor(options: SidebarControllerOptions = {}) {
		this.options = {
			rootSelector: options.rootSelector ?? '[data-sidebar]',
			toggleSelector: options.toggleSelector ?? '[data-sidebar-toggle]',
			closeSelector: options.closeSelector ?? '[data-sidebar-close]',
			overlaySelector: options.overlaySelector ?? '[data-sidebar-overlay]',
			openClass: options.openClass ?? 'is-open',
			bodyOpenClass: options.bodyOpenClass ?? 'sidebar-open',
			responsiveBreakpoint: options.responsiveBreakpoint ?? '(min-width: 768px)'
		};
	}

	public init(): void {
		this.root = document.querySelector<HTMLElement>(this.options.rootSelector);
		if (!this.root) {
			return;
		}

		this.overlay = document.querySelector<HTMLElement>(this.options.overlaySelector);
		this.toggles = Array.from(document.querySelectorAll<HTMLElement>(this.options.toggleSelector));
		this.closes = Array.from(document.querySelectorAll<HTMLElement>(this.options.closeSelector));

		this.toggles.forEach((toggle) => {
			toggle.addEventListener('click', this.handleToggle);
		});

		this.closes.forEach((close) => {
			close.addEventListener('click', this.handleClose);
		});

		if (this.overlay) {
			this.overlay.addEventListener('click', this.handleClose);
		}

		document.addEventListener('keydown', this.handleKeydown);
		window.addEventListener('resize', this.handleResize);

		this.close();
	}

	public destroy(): void {
		this.toggles.forEach((toggle) => {
			toggle.removeEventListener('click', this.handleToggle);
		});

		this.closes.forEach((close) => {
			close.removeEventListener('click', this.handleClose);
		});

		if (this.overlay) {
			this.overlay.removeEventListener('click', this.handleClose);
		}

		document.removeEventListener('keydown', this.handleKeydown);
		window.removeEventListener('resize', this.handleResize);
	}

	public open(): void {
		if (!this.root) {
			return;
		}

		this.root.classList.add(this.options.openClass);
		this.root.classList.remove(...this.closedSidebarClasses);
		this.root.classList.add(...this.openSidebarClasses);
		document.body.classList.add(this.options.bodyOpenClass);
		this.setExpanded(true);
		this.toggleOverlay(true);
		this.updateState('open');
	}

	public close(): void {
		if (!this.root) {
			return;
		}

		this.root.classList.remove(this.options.openClass);
		this.root.classList.remove(...this.openSidebarClasses);
		this.root.classList.add(...this.closedSidebarClasses);
		document.body.classList.remove(this.options.bodyOpenClass);
		this.setExpanded(false);
		this.toggleOverlay(false);
		this.updateState('closed');
	}

	public toggle(): void {
		if (!this.root) {
			return;
		}

		if (this.root.classList.contains(this.options.openClass)) {
			this.close();
			return;
		}

		this.open();
	}

	private handleToggle = (event: Event): void => {
		event.preventDefault();
		this.toggle();
	};

	private handleClose = (event: Event): void => {
		event.preventDefault();
		this.close();
	};

	private handleKeydown = (event: KeyboardEvent): void => {
		if (event.key === 'Escape') {
			this.close();
		}
	};

	private handleResize = (): void => {
		if (!this.root) {
			return;
		}

		if (window.matchMedia(this.options.responsiveBreakpoint).matches) {
			this.close();
		}
	};

	private setExpanded(expanded: boolean): void {
		this.toggles.forEach((toggle) => {
			toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
		});
	}

	private updateState(state: 'open' | 'closed'): void {
		if (!this.root) {
			return;
		}

		this.root.setAttribute('data-state', state);
		if (this.overlay) {
			this.overlay.setAttribute('data-state', state);
		}
	}

	private toggleOverlay(isOpen: boolean): void {
		if (!this.overlay) {
			return;
		}

		if (isOpen) {
			this.overlay.classList.remove(...this.closedOverlayClasses);
			this.overlay.classList.add(...this.openOverlayClasses);
			return;
		}

		this.overlay.classList.remove(...this.openOverlayClasses);
		this.overlay.classList.add(...this.closedOverlayClasses);
	}
}

const initSidebar = () => {
    const controller = new SidebarController();
    controller.init();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
} else {
    initSidebar();
}