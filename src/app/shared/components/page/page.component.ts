import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-page',
  template: '<ng-content></ng-content>',
  standalone: false,
})
export class PageComponent implements OnChanges {
  /** Titre HTML (<title>) du navigateur */
  @Input({ required: true }) headTitle!: string;

  /** Optionnel: préfixe/suffixe */
  @Input() suffix = '';
  @Input() prefix = '';

  constructor(private readonly titleSvc: Title) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['headTitle'] || changes['suffix'] || changes['prefix']) {
      const base = (this.headTitle ?? '').trim();
      if (!base) return;

      const full = `${this.prefix}${base}${this.suffix}`.trim();
      this.titleSvc.setTitle(full);
    }
  }
}
