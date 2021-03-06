import React, { Component } from 'react';
import {
  Animated,
  Clipboard,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Animation from 'lottie-react-native';
import { BlurView } from 'react-native-blur';

import Icon from '../resources/icon';
import { FluidCard, FluidHeader, FluidButton } from '../components';
import { AddTrip } from '../persistence/db-helper';

import { HEIGHT, WIDTH, SMALL } from '../global';
import { KEYS } from '../config/keys';

import loader from '../animation/loader.json';

class Ongoing extends Component {
  state = {
    onStartFade: new Animated.Value(0),
    newTripFade: new Animated.Value(0),
    loadingFade: new Animated.Value(0),
    displayNewTripView: false,
    displayLoadingBar: true,
    displayEditTrip: false,
    blur: false,
    id: '',
    results: {},
    newTripCardDisabled: true,
    visible: true,
    buttonDisabled: false,
  };

  constructor(props) {
    super(props);
  }

  componentWillMount() {
    this.fadeInit();
    this.setFlip();
  }

  componentDidMount() {
    this.fetchID();
  }

  fadeInit() {
    Animated.timing(this.state.onStartFade, {
      toValue: 1,
      duration: 2000,
    }).start(animation => {
      if (animation.finished) {
        this.setState({ newTripCardDisabled: false });
      }
    });
  }

  setFlip() {
    this.flipValue = new Animated.Value(0);
    this.flipValueListener = 0;

    this.flipValue.addListener(({ value }) => {
      this.flipValueListener = value;
    });

    this.frontInterpolate = this.flipValue.interpolate({
      inputRange: [0, 180],
      outputRange: ['0deg', '180deg'],
    });
    this.backInterpolate = this.flipValue.interpolate({
      inputRange: [0, 180],
      outputRange: ['180deg', '360deg'],
    });
  }

  flipCard() {
    if (this.flipValueListener >= 90) {
      Animated.spring(this.flipValue, {
        toValue: 0,
        friction: 8,
        tension: 10,
      }).start();
    } else {
      Animated.spring(this.flipValue, {
        toValue: 180,
        friction: 8,
        tension: 10,
      }).start();
    }
  }

  async fetchResults() {
    return await fetch('http://localhost:8000/v1/results?id=' + this.state.id);
  }

  async flipAndLoad() {
    let load = () => {
      Animated.timing(this.state.loadingFade, {
        toValue: 1,
        duration: 1000,
      }).start(() => this.loading.play());
    };

    this.flipCard();

    this.setState({ buttonDisabled: true });

    if (this.state.displayLoadingBar) load();

    try {
      let results = await this.fetchResults();
      let resultsJSON = await results.json();

      Animated.timing(this.state.loadingFade, {
        toValue: 0,
        duration: 2000,
      });

      this.setState({
        results: resultsJSON,
        displayLoadingBar: false,
        displayEditTrip: true,
      });

      this.createTripFromResults(this.state.results);
    } catch (error) {
      console.log(error);
    }
  }

  resultsError() {
    let error = { error: 'invalid' };
    return JSON.stringify(this.state.results) === JSON.stringify(error);
  }

  createTripFromResults(results) {
    if (this.resultsError()) {
      // Email parsing failed, ask for manual entry or re-try.
    } else {
      AddTrip({
        id: results.result.flight.reservationId,

        airlineCode: results.result.flight.reservationFor[0].flightNumber.substring(
          0,
          2,
        ),
        flightNumber: results.result.flight.reservationFor[0].flightNumber.substring(
          2,
        ),

        departureTime: new Date(
          results.result.flight.reservationFor[0].departureTime,
        ),
        arrivalTime: new Date(
          results.result.flight.reservationFor[0].arrivalTime,
        ),

        departureAirportCode:
          results.result.flight.reservationFor[0].departureAirport.iataCode,
        arrivalAirportCode:
          results.result.flight.reservationFor[0].arrivalAirport.iataCode,
      });
    }
  }

  copyID(id) {
    Clipboard.setString(id);
  }

  airlineForCode(iata) {
    fetch(
      `https://iatacodes.org/api/v6/airlines?api_key=${KEYS.IATA_CODES_API}&code=${iata}`,
    )
      .then(response => response.json())
      .then(responseJSON => {
        return responseJSON.response.name;
      })
      .catch(error => {
        console.log('Failed to fetch response.', error);
      });
  }

  airportForCode(iata) {
    fetch(
      `https://iatacodes.org/api/v6/airports?api_key=${KEYS.IATA_CODES_API}&code=${iata}`,
    )
      .then(response => response.json())
      .then(responseJSON => {
        return responseJSON.response.name;
      })
      .catch(error => {
        console.log('Failed to fetch response.', error);
      });
  }

  cityForCode(iata) {
    let airports = require('../persistence/internal/airports.json');
    for (icao in airports) {
      if (airports[icao].iata === iata) {
        return airports[icao].city;
      }
    }
  }

  fetchID() {
    fetch('http://localhost:8000/v1/keygen')
      .then(response => response.json())
      .then(responseJSON => {
        this.setState({ id: responseJSON.id });
      })
      .catch(error => {
        console.log('Failed to fetch response.', error);
      });
  }

  openMailApp() {
    const url = 'message://';
    Linking.canOpenURL(url)
      .then(supported => {
        if (!supported) {
          console.log("Can't handle url: " + url);
        } else {
          return Linking.openURL(url);
        }
      })
      .catch(err => console.log('An error occurred', err));
  }

  newTrip() {
    const frontAnimatedStyle = {
      transform: [{ rotateY: this.frontInterpolate }],
      backfaceVisibility: 'hidden',
    };
    const backAnimatedStyle = {
      transform: [{ rotateY: this.backInterpolate }],
      backfaceVisibility: 'hidden',
    };

    let fadeInNewTrip = () => {
      Animated.timing(this.state.newTripFade, {
        toValue: 1,
        duration: 250,
      }).start();
    };

    let fadeOutNewTrip = () => {
      Animated.timing(this.state.newTripFade, {
        toValue: 0,
        duration: 250,
      }).start(() => {
        this.setState({
          displayNewTripView: false,
          blur: false,
          newTripFade: new Animated.Value(0),
          visible: true,
          displayLoadingBar: true,
          displayEditTrip: false,
        });
      });
    };

    let loadingBar = () => (
      <Animated.View style={{ opacity: this.state.loadingFade }}>
        <Animation
          ref={animation => {
            this.loading = animation;
          }}
          style={{
            width: WIDTH * 0.8,
            height: WIDTH * 0.8,
          }}
          loop={true}
          speed={0.5}
          source={loader}
        />
      </Animated.View>
    );

    if (SMALL()) {
      styles.textStyle.fontSize = 16;
    }

    fadeInNewTrip();

    return (
      <Animated.View
        style={[styles.centerView, { opacity: this.state.newTripFade }]}>
        <FluidCard
          height={HEIGHT * 0.7}
          style={[
            backAnimatedStyle,
            { borderWidth: 0, justifyContent: 'center' },
          ]}>
          <View style={{ flex: 0, borderWidth: 0 }}>
            {this.state.displayLoadingBar ? loadingBar() : null}
          </View>
          <View>{this.state.displayEditTrip ? this.editTrip() : null}</View>
        </FluidCard>
        <FluidCard
          height={HEIGHT * 0.7}
          style={[
            { borderWidth: 0, position: 'absolute', justifyContent: 'center' },
            frontAnimatedStyle,
          ]}>
          <View style={{ borderWidth: 0 }}>
            <View
              style={{
                top: 5,
                borderWidth: 0,
                flex: 0,
                justifyContent: 'flex-start',
              }}>
              <View style={{ borderWidth: 0 }}>
                <FluidButton
                  style={styles.idStyle}
                  alignSelf="center"
                  onPress={() => this.copyID(this.state.id)}
                  textStyle={SMALL() ? { fontSize: 12 } : { fontSize: 14 }}
                  disabled={this.state.buttonDisabled}>
                  {this.state.id}
                </FluidButton>

                <Icon
                  name="Up-Chevron"
                  size={14}
                  color="#2B2B2B"
                  style={[
                    {
                      textAlign: 'center',
                      marginTop: HEIGHT * 0.7 * 0.02,
                      marginBottom: HEIGHT * 0.7 * 0.02,
                    },
                  ]}
                />

                <Text style={[styles.textStyle]}>Tap that to copy.</Text>
              </View>

              <FluidButton
                alignSelf="center"
                style={{
                  marginTop: HEIGHT * 0.7 * 0.04,
                  marginBottom: HEIGHT * 0.7 * 0.04,
                }}
                onPress={this.openMailApp}
                textStyle={SMALL() ? { fontSize: 12 } : { fontSize: 14 }}
                disabled={this.state.buttonDisabled}>
                Go to your mailbox
              </FluidButton>

              <View style={{ borderWidth: 0 }}>
                <Text style={[styles.textStyle]}>Forward your ticket to</Text>
                <Text style={[styles.textStyle, styles.emailStyle]}>
                  reservations@skyborne.co
                </Text>
                <Text style={styles.textStyle}>
                  {'with the copied ID as\nthe subject line.'}
                </Text>
              </View>

              <Text
                style={[styles.textStyle, { marginTop: HEIGHT * 0.7 * 0.03 }]}>
                {'Come back and hit next\nwhen ready'}.
              </Text>
            </View>
            <View style={{ flex: 0, justifyContent: 'center', borderWidth: 0 }}>
              <FluidButton
                alignSelf="center"
                style={{ marginTop: HEIGHT * 0.7 * 0.06 }}
                onPress={() => this.flipAndLoad()}
                textStyle={SMALL() ? { fontSize: 12 } : { fontSize: 14 }}
                disabled={this.state.buttonDisabled}>
                Next
              </FluidButton>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              fadeOutNewTrip();
            }}
            style={{
              position: 'absolute',
              top: 0,
              borderWidth: 0,
            }}
            disabled={this.state.buttonDisabled}>
            <Icon
              name="X"
              size={15}
              color="#2B2B2B"
              style={{
                borderWidth: 0,
                marginLeft: HEIGHT * 0.7 * 0.04,
                marginTop: HEIGHT * 0.7 * 0.04,
                marginBottom: HEIGHT * 0.7 * 0.04,
              }}
            />
          </TouchableOpacity>
        </FluidCard>
      </Animated.View>
    );
  }

  editTrip() {
    return (
      <View>
        <Text />
      </View>
    );
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <FluidHeader>Ongoing</FluidHeader>
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: this.state.onStartFade,
          }}>
          {this.state.visible && (
            <TouchableOpacity
              disabled={this.state.newTripCardDisabled}
              onPress={() => {
                this.setState({ displayNewTripView: true, blur: true });
                this.setState({ visible: false });
              }}>
              <FluidCard
                height={HEIGHT * 0.52}
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text style={styles.textStyle}>Tap to add a new trip.</Text>
              </FluidCard>
            </TouchableOpacity>
          )}
        </Animated.View>
        {this.state.blur ? (
          <BlurView blurType="light" style={styles.absolute} />
        ) : null}
        {this.state.displayNewTripView ? this.newTrip() : null}
      </View>
    );
  }
}

let styles = {
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },

  initCard: {
    alignItems: 'center',
  },

  centerView: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },

  textStyle: {
    fontFamily: 'Rubik',
    fontSize: 18,
    fontWeight: '200',
    textAlign: 'center',
  },

  idStyle: {
    shadowOpacity: 0,
    backgroundColor: '#E8E8E8',
    borderRadius: 20,
  },

  emailStyle: {
    color: '#8C8C8C',
  },
};

export default Ongoing;
