import { Injectable } from '@angular/core';
import { Registro } from '../pages/models/registro.model';
import { Storage } from '@ionic/storage';
import { NavController, Platform } from '@ionic/angular';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { EmailComposer } from '@awesome-cordova-plugins/email-composer/ngx';


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
    private platform: Platform,
    private file: File,
    private emailComposer: EmailComposer
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

      case 'geo':
        this.navCtrl.navigateForward(`tabs/tab2/mapa/${registro.text}`);

      default:
        break;
    }
  }

  enviarCorreo() {
    const arrTemp = [];
    const titulo = "Tipo, Formato, Creado en, Texto\n";

    arrTemp.push(titulo);

    this.guardados.forEach((registros) => {
      arrTemp.push(`${registros.type},${registros.format},${registros.created},${registros.text.replace(',', ' ')}\n`);
    })

    this.crearArchivoFisico(arrTemp.join());

  }


  crearArchivoFisico(text: string) {
    this.file.checkFile(this.file.dataDirectory, 'registros.csv').then(existe => {
      console.log('Existe el archivo', existe);
      return this.escribirEnArchivo(text);
    }).catch(err => {
      return this.file.createFile(this.file.dataDirectory, 'registros.csv', false)
        .then(res => this.escribirEnArchivo(text))
        .catch(err2 => console.log("no se pudo crear el archivo", err2)
        );
    })
  }

  async escribirEnArchivo(text: string) {
    await this.file.writeExistingFile(this.file.dataDirectory, 'registros.csv', text);

    const archivo = `${this.file.dataDirectory}registros.csv`;

    const email = {
      to: 'emanuel.buendia.t@gmail.com',
      // cc: '',
      // bcc: ['john@doe.com', 'jane@doe.com'],
      attachments: [
        archivo,
      ],
      subject: 'Backup de scans',
      body: 'Aquí tienes los backups de scans.',
      isHtml: true
    }

    // Send a text message using default options
    this.emailComposer.open(email);

  }

}
