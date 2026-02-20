import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

export type ButtonMode = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class ButtonComponent {
  /** Active/désactive le bouton (isenabled = true => enabled) */
  @Input() isenabled = true;

  /** Type HTML du bouton */
  @Input() type: ButtonMode = 'button';

  /** Texte du bouton */
  @Input() text = 'Valider';

  /** Style Material */
  @Input() variant: 'basic' | 'raised' | 'stroked' | 'flat' | 'icon' = 'raised';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';

  /** Props CSS */
  @Input() className = '';
  @Input() style: Record<string, any> | null = null;
  @Input() fullWidth = false;

  /** Autres props */
  @Input() ariaLabel?: string;
  @Input() loading = false;

  /** Redirection (si défini, le bouton devient un lien) */
  @Input() routerLink?: string | any[];
  @Input() queryParams?: Record<string, any>;

  /** Click (uniquement en mode bouton) */
  @Output() pressed = new EventEmitter<MouseEvent>();

  get disabled(): boolean {
    return !this.isenabled || this.loading;
  }

  onClick(ev: MouseEvent): void {
    if (this.disabled) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    this.pressed.emit(ev);
  }
}

