import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  Switch,
  TouchableOpacity,
  ToastAndroid,
} from "react-native";
var _ = require("lodash");
import BluetoothSerial from "react-native-bluetooth-serial";

export default class App extends Component<{}> {
  constructor(props) {
    super(props);
    this.state = {
      isEnabled: false,
      discovering: false,
      devices: [],
      unpairedDevices: [],
      connected: false,
    };
  }
  async pairDevice(device) {
    console.log("start pairing" + device.id);

    await BluetoothSerial.pairDevice(device.id)
      .then((paired) => {
        console.log("paired");
        if (paired) {
          console.log(`Device ${device.name} paired successfully`);
          const devices = this.state.devices;
          devices.push(device);
          this.setState({
            devices,
            unpairedDevices: this.state.unpairedDevices.filter(
              (d) => d.id !== device.id
            ),
          });
        } else {
          console.log(`Device ${device.name} pairing failed`);
        }
      })
      .catch((err) => console.log(err.message));
  }

  async connect(device) {
    // await this.pairDevice(device);
    this.setState({ connecting: true });
    console.log("start connect", "debug");
    BluetoothSerial.connect(device.id)
      .then((res) => {
        console.log(`Connected to device ${device.name}`);
      })
      .catch((err) => console.log(err.message));
  }
  _renderItem(item) {
    return (
      <TouchableOpacity onPress={() => this.connect(item.item)}>
        <View style={styles.deviceNameWrap}>
          <Text style={styles.deviceName}>
            {item.item.name ? item.item.name : item.item.id}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
  async enable() {
    await BluetoothSerial.enable()
      .then((res) => this.setState({ isEnabled: true }))
      .catch((err) => Toast.showShortBottom(err.message));

    await BluetoothSerial.list()
      .then((res) => this.setState({ devices: res }))
      .catch((err) => Toast.showShortBottom(err.message));
  }

  disable() {
    BluetoothSerial.disable()
      .then((res) => this.setState({ isEnabled: false }))
      .catch((err) => Toast.showShortBottom(err.message));
  }

  toggleBluetooth(value) {
    if (value === true) {
      this.enable();
    } else {
      this.disable();
    }
  }
  discoverAvailableDevices() {
    if (this.state.discovering) {
      return false;
    } else {
      this.setState({ discovering: true });
      BluetoothSerial.discoverUnpairedDevices()
        .then((unpairedDevices) => {
          const uniqueDevices = _.uniqBy(unpairedDevices, "id");
          console.log(uniqueDevices);
          this.setState({ unpairedDevices: uniqueDevices, discovering: false });
        })
        .catch((err) => console.log(err.message));
    }
  }
  toggleSwitch() {
    BluetoothSerial.write('{"mode":"INFRA","ssid": "RELYON","pass":"12345678"}')
      .then((res) => {
        console.log(res);
        console.log("Successfuly wrote to device");
        this.setState({ connected: true });
      })
      .catch((err) => console.log(err.message));
  }
  render() {
    return (
      <View style={styles.container}>
        <View style={styles.toolbar}>
          <Text style={styles.toolbarTitle}>Bluetooth Device List</Text>
          <View style={styles.toolbarButton}>
            <Switch
              value={this.state.isEnabled}
              onValueChange={(val) => this.toggleBluetooth(val)}
            />
          </View>
        </View>
        <Button
          onPress={this.discoverAvailableDevices.bind(this)}
          title="Scan for Devices"
          color="#841584"
        />
        <FlatList
          style={{ flex: 1 }}
          data={this.state.devices}
          keyExtractor={(item) => item.id}
          renderItem={(item) => this._renderItem(item)}
        />
        <Button
          onPress={this.toggleSwitch.bind(this)}
          title="Switch(On/Off)"
          color="#841584"
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5FCFF",
  },
  toolbar: {
    paddingTop: 30,
    paddingBottom: 30,
    flexDirection: "row",
  },
  toolbarButton: {
    width: 50,
    marginTop: 8,
  },
  toolbarTitle: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 20,
    flex: 1,
    marginTop: 6,
  },
  deviceName: {
    fontSize: 17,
    color: "black",
  },
  deviceNameWrap: {
    margin: 10,
    borderBottomWidth: 1,
  },
});
