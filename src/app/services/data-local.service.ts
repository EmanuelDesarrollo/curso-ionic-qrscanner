import { Injectable } from '@angular/core';
import { Registro } from '../pages/models/registro.model';
import { Storage } from '@ionic/storage';
import { NavController, Platform } from '@ionic/angular';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';

@Injectable({
  providedIn: 'root'
})
export class DataLocalService {

  private _storage: Storage | null = null;
  guardados: Registro[] = [];

  constructor(
    private storage: Storage,
    private navCtrl: NavController,
    private iab: InAppBrowser,
    private platform: Platform
  ) {
    this.init();
  }

  guardarRegistro(format: string, text: string) {
    const nuevoRegistro = new Registro(format, text);
    this.guardados.unshift(nuevoRegistro);
    this._storage.set('guardados', this.guardados);
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    this.loadGuardados();
  }

  async loadGuardados() {
    const guardados = await this._storage.get('guardados');
    this.guardados = guardados || [];
    return this.guardados;
  }

  abrirRegistro(registro: Registro) {
    this.navCtrl.navigateForward('tabs/tab2');
    switch (registro.type) {
      case 'http':
        // Abrir navegador.
        if (this.platform.is('ios') || this.platform.is('android')) {
          const browser = this.iab.create(registro.text);
          browser.show();
        } else {
          window.open(registro.text, '_blank');
        }
        break;

      default:
        break;
    }
  }

}
