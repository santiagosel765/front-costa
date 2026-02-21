// src/app/pages/welcome/welcome.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// Ng-Zorro imports
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';

interface StatCard {
  icon: string;
  value: string;
  label: string;
  color: string;
}

interface QuickAction {
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  route: string;
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule
  ],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {

  stats: StatCard[] = [
    {
      icon: 'shopping',
      value: '1,247',
      label: 'Productos',
      color: '#f4a460'
    },
    {
      icon: 'team',
      value: '89',
      label: 'Clientes',
      color: '#daa520'
    },
    {
      icon: 'dollar',
      value: '$45,230',
      label: 'Ventas del Mes',
      color: '#cd853f'
    },
    {
      icon: 'rise',
      value: '+15%',
      label: 'Crecimiento',
      color: '#32cd32'
    }
  ];

  quickActions: QuickAction[] = [
    {
      icon: 'plus-circle',
      title: 'Agregar Producto',
      description: 'Añade nuevos productos a tu inventario de manera rápida y sencilla',
      buttonText: 'Crear Producto',
      route: '/main/products/create'
    },
    {
      icon: 'shopping-cart',
      title: 'Nueva Venta',
      description: 'Registra una nueva venta y actualiza automáticamente tu inventario',
      buttonText: 'Realizar Venta',
      route: '/main/sales/new'
    },
    {
      icon: 'bar-chart',
      title: 'Ver Reportes',
      description: 'Consulta estadísticas detalladas de ventas, inventario y rendimiento',
      buttonText: 'Ver Reportes',
      route: '/main/reports'
    },
    {
      icon: 'tags',
      title: 'Gestionar Categorías',
      description: 'Organiza y administra las categorías de tus productos',
      buttonText: 'Ir a Categorías',
      route: '/main/categories/panel'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Inicialización del componente
    this.animateStats();
  }

  private animateStats(): void {
    // Animar los números de estadísticas
    setTimeout(() => {
      this.stats.forEach((stat, index) => {
        setTimeout(() => {
          this.animateNumber(stat);
        }, index * 200);
      });
    }, 1000);
  }

  private animateNumber(stat: StatCard): void {
    // Extraer número del valor
    const numericValue = stat.value.replace(/[^\d]/g, '');
    if (numericValue) {
      const target = parseInt(numericValue);
      const prefix = stat.value.replace(numericValue, '');
      let current = 0;
      const increment = target / 50;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        stat.value = prefix + Math.floor(current).toLocaleString();
      }, 30);
    }
  }

  navigateToAction(action: QuickAction): void {
    this.router.navigate([action.route]);
  }

  navigateToProducts(): void {
    this.router.navigate(['/main/products']);
  }

  navigateToReports(): void {
    this.router.navigate(['/main/reports']);
  }
}