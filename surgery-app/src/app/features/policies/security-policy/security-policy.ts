import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-security-policy',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './security-policy.html',
  styleUrl: './security-policy.css'
})
export class SecurityPolicyComponent {
  lastUpdated = '15 de abril de 2026';
}