import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.html'
})
export class Footer {
  @Input() version = '1.0.0';
  @Input() companyName = 'AMTERP Solutions India Ltd.';
  year = new Date().getFullYear();
}
