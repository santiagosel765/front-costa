import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-client-shell',
  standalone: true,
  imports: [CommonModule, NzCardModule],
  templateUrl: './client-shell.component.html',
  styleUrls: ['./client-shell.component.css'],
})
export class ClientShellComponent {}
