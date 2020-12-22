import { Component, OnInit, NgZone } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular'
import { Router } from '@angular/router';
import { BLE } from '@ionic-native/ble/ngx';
import { ActivatedRoute } from '@angular/router';

//bluetooth uuid's
const BLE_SERVICE = '00001523-1212-efde-1523-785feabcd123';
const READ_CHARACTERISTIC = '00001524-1212-efde-1523-785feabcd123';
const READ_WRITE_CHARACTERISTIC = '00001525-1212-efde-1523-785feabcd123';
@Component({
    selector: 'app-detail',
    templateUrl: './detail.page.html',
    styleUrls: ['./detail.page.scss'],
})
// after scan and on select it goes to a details page
export class DetailPage implements OnInit {
    [x: string]: any;
    statusMessage: string;
    peripheral: any = [];
    device: any;
    string: any;

    constructor(
        private ble: BLE,
        private ngzone: NgZone,
        private route: ActivatedRoute,
        private alertCtrl: AlertController,
    ) {
        this.route.queryParams.subscribe
            (params => {
                if (params && params.special) {
                    this.device = JSON.parse(params.special);
                    // connect
                    this.ble.connect(this.device.id).subscribe(
                        peripheral => this.onConnected(peripheral),
                        _peripheral => this.showAlert('Disconnected', 'the peripheral unexpectedly disconnected', this.device.name)
                    );
                }
            }
            );
    }

    onConnected(peripheral) {
        console.log('on connected');
        this.peripheral = peripheral;
        this.ngzone.run(() => {
            console.log('Connected to ' + (peripheral.name || peripheral.id));
            this.ble.read(this.peripheral.id, BLE_SERVICE, READ_CHARACTERISTIC).then(
                data => {
                    console.log(data);
                },
                buffer => {
                    let data = new Uint8Array(buffer);
                    this.ngzone.run(() => {
                        this.power = data[0] !== 0;
                        console.log('the power is :', this.power)
                    });
                }
            );

        });
        //notification
        this.ble.startNotification(this.peripheral.id, BLE_SERVICE, READ_CHARACTERISTIC).subscribe(
            data => this.onButtonStateChange(data),
            () => this.showAlert('Unexpected Error', 'Failed to subscribe READ_CHARACTERISTIC', this.data)
        );
        // end notification
        //read start
        this.ble.read(this.peripheral.id, BLE_SERVICE, READ_CHARACTERISTIC).then(
            function (data) {
                console.log("Hooray we have data" + JSON.stringify(data));
                alert("Successfully read data from device." + JSON.stringify(data));
            },
            function () {
                alert("Failed to read characteristic from device.");
            }
        );
        let values = new Uint8Array(16)
        values[0] = 0x23,
            values[1] = 0xD1,
            values[2] = 0xBC,
            values[3] = 0xEA,
            values[4] = 0x5F,
            values[5] = 0x78,
            values[6] = 0x23,
            values[7] = 0x15,
            values[8] = 0xDE,
            values[9] = 0xEF,
            values[10] = 0x12,
            values[11] = 0x12,
            values[12] = 0x00,
            values[13] = 0x45,
            values[14] = 0x60,
            values[15] = 0x20,

        //     console.log(values)

        //let values = stringToBytes('abcdefghijklmnop');

            this.ble.write(this.peripheral.id, BLE_SERVICE, READ_WRITE_CHARACTERISTIC,values.buffer as ArrayBuffer).then(
                () => this.showAlert("data write at 4",values[4],this.values),
                e => this.showAlert('Unexpected Error', 'Error writing the data', e)
            );
        console.log('written data to nordic', bytesToString(values))

        // ASCII only
        function bytesToString(values) {
            return String.fromCharCode.apply(null, new Uint8Array(values));
        }
        this.ble.read(this.peripheral.id, BLE_SERVICE, READ_WRITE_CHARACTERISTIC).then(
            (data) => {
                //this.showAlert("read write data is ", JSON.stringify(values), values)
                this.ngzone.run(() => {
                    this.writeState = JSON.stringify(data);
                    console.log("this new read is" + this.writeState);
                });
            },
            e => this.showAlert("Successfully read the written data from device.", JSON.stringify(values), e)
        );
        //write ends

    }
    onButtonStateChange(buffer: ArrayBuffer) {
        let data = new Uint8Array(buffer);
        this.ngzone.run(() => {
            this.buttonState = JSON.stringify(data);
            console.log("this read is" + this.buttonState);
        });
    }

    ionViewWillLeave() {
        console.log('ion View Will Leave disconnecting bluetooth');
        this.ble.disconnect(this.peripheral.id).then(
            () => console.log('Disconnected'),
            () => console.log('Error Disconnecting')
        )
    }
    async showAlert(header, subHeader, message) {
        let alert = this.alertCtrl.create(
            {
                header: header,
                message: message,
                buttons: ["ok"]
            }
        );
        (await alert).present();
    }
    ngOnInit() {
    }
}
import { Component, OnInit, NgZone } from '@angular/core';
import { AlertController, ToastController, NavController } from '@ionic/angular'
import { Router } from '@angular/router';
import { BLE } from '@ionic-native/ble/ngx';
import { NavigationExtras } from '@angular/router';

//bluetooth uuid's
// const BLE_HEART_SERVICE = '0000aaaa0-0000-1000-8000-aabbccddeeff';
@Component({
  selector: 'app-peripherals',
  templateUrl: './peripherals.page.html',
  styleUrls: ['./peripherals.page.scss'],
})
export class PeripheralsPage implements OnInit {
  [x: string]: any;
  numberofDevices: any

  constructor(
    public navCtrl: NavController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router,
    private ble: BLE,
    private ngzone: NgZone
  ) { }

  ngOnInit() {
  }
  device_list: any[];

  scan() {

    this.device_list = [];
    this.ble.scan([], 5).subscribe(
      device => this.onDeviceDiscovered(device),
      error => this.scanError(error));
  }

  // If location permission is denied, you'll end up here
  async scanError(error) {
    this.setStatus('Error ' + error);
    let toast = await this.toastCtrl.create({
      message: 'Error scanning for Bluetooth low energy devices',
      position: 'middle',
      duration: 5000
    });
    toast.present();
  }
  setStatus(message) {
    console.log(message);
    this.ngZone.run(() => {
      this.statusMessage = message;
    });
  }

  onDeviceDiscovered(device) {
    console.log('discovered' + JSON.stringify(device, null, 2));
    this.ngzone.run(() => {
      device['advertising'] = new Uint8Array(device.advertising)
      device['service'] = new Uint8Array(device.advertising)
      this.device_list.push(device);
      this.numberOfDevices = this.device_list.length
      console.log(device['advertising'])
      console.log('-------------')
      console.log(device["service"])
    })
  }

  deviceSelected(device) {
    console.log(JSON.stringify(device) + ' selected');
    let navigationExtras: NavigationExtras = {
      queryParams: {
        special: JSON.stringify(device)
      }
    };
    this.router.navigate(['detail'], navigationExtras);
  }
}
