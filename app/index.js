import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import CitySearchWithAutoSuggest from "../component/serachc.js";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import * as Location from "expo-location";

const API_KEY = "e0965310293ef580143b14b8ebf99412";

export default function App() {
  const [coords, setCoords] = useState(null);
  const [tempCoords, setTempCoords] = useState(null);
  const [cityName, setCityName] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [region, setRegion] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        setLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setCoords({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      fetchWeather(latitude, longitude);
    })();
  }, []);

  const fetchWeather = async (lat, lon) => {
    try {
      setLoading(true);
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        ),
      ]);

      const weatherJson = await weatherRes.json();
      const forecastJson = await forecastRes.json();

      setWeatherData(weatherJson);
      setForecastData(
        Array.isArray(forecastJson.list) ? forecastJson.list : []
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = useCallback(async (latitude, longitude) => {
    try {
      const res = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (res.length > 0) {
        const place = res[0];
        const name = place.city || place.region || place.name || "Unknown location";
        setCityName(name);
      } else {
        setCityName("Unknown location");
      }
    } catch {
      setCityName("Unknown location");
    }
  }, []);

  const onMapPress = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setTempCoords({ latitude, longitude });
    await reverseGeocode(latitude, longitude);
    setModalVisible(true);
  };

  const onMarkerDragEnd = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setTempCoords({ latitude, longitude });
    await reverseGeocode(latitude, longitude);
    setModalVisible(true);
  };

  const confirmLocation = () => {
    if (tempCoords) {
      setCoords(tempCoords);
      setRegion({
        latitude: tempCoords.latitude,
        longitude: tempCoords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      fetchWeather(tempCoords.latitude, tempCoords.longitude);
    }
    setModalVisible(false);
  };

  const [time, setTime] = useState(getFormattedTime());

  function getFormattedTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();

    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    if (seconds < 10) seconds = "0" + seconds;

    return `${hours}:${minutes}:${seconds}`;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getFormattedTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayForecast = forecastData.filter(
    (item) => new Date(item.dt_txt).getDate() === new Date().getDate()
  );
  const fiveDayForecast = forecastData.filter(
    (item) => new Date(item.dt_txt).getDate() !== new Date().getDate()
  );

  // Weather icon URL helper
  const getIconUrl = (icon) =>
    `https://openweathermap.org/img/wn/${icon}@4x.png`;

  // Background image logic remains same as original (or can be replaced)
  const getBackgroundImage = () => {
    if (!weatherData?.weather || !weatherData.sys) {
      return "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0";
    }
    const condition = weatherData.weather[0].main?.toLowerCase();
    const currentTime = Math.floor(Date.now() / 1000);
    const isDay =
      weatherData.sys.sunrise && weatherData.sys.sunset
        ? currentTime > weatherData.sys.sunrise &&
          currentTime < weatherData.sys.sunset
        : true;

    const images = {
      clear: isDay
        ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzEGlBkdISStFpZoKhZ2bI8VOaNzxjwD7p2g&s"
        : "https://www.shutterstock.com/image-photo/full-moon-background-600nw-128504084.jpg",
      rain: isDay
        ? "https://media.istockphoto.com/id/1257951336/photo/transparent-umbrella-under-rain-against-water-drops-splash-background-rainy-weather-concept.jpg?s=612x612&w=0&k=20&c=lNvbIw1wReb-owe7_rMgW8lZz1zElqs5BOY1AZhyRXs="
        : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwRiklEn8M_WhHzRpvZBGxFkqBaRqpzVObztJzkKlG5Rx1-UVqfgDzjHnrPicdhRdCfdU&usqp=CAU",
      snow: isDay
        ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBRarBQqs7gxWsLFRpcohxMmRsLqlBBlMm6xsHRn2DNXAizDCXEAeLb64d6IMGrRqPQaY&usqp=CAU"
        : "https://imgcdn.stablediffusionweb.com/2024/11/15/fcc265ce-7400-4d5d-a232-253c1aa756c7.jpg",
      cloud: isDay
        ? "https://i1.pickpik.com/photos/622/242/506/sky-cloud-blue-sky-weather-preview.jpg"
        : "https://media.istockphoto.com/id/178411641/photo/tragic-night-sky-with-a-full-moon.jpg?s=612x612&w=0&k=20&c=tT1-CJ82eB_gRiV06jw8zTAUJ5yNh-euVWKmmVQbCRw=",
    };

    return (
      images[
        Object.keys(images).find((key) => condition.includes(key))
      ] || "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0"
    );
  };

  return (
    <ImageBackground source={{ uri: getBackgroundImage() }} style={styles.bg}>
      <View style={styles.container}>
        <CitySearchWithAutoSuggest
          onSelectCity={({ lat, lon }) => {
            setCoords({ latitude: lat, longitude: lon });
            setRegion({
              latitude: lat,
              longitude: lon,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
            fetchWeather(lat, lon);
          }}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          weatherData && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* TOP GLASS CARD */}
              <View style={styles.glassCard}>
                <View style={styles.topRow}>
                  <View style={styles.locationCol}>
                    <Text style={styles.cityText}>{weatherData.name}</Text>
                    <Text style={styles.countryText}>{weatherData.sys?.country}</Text>
                  </View>
                  <Text style={styles.timeText}>{time}</Text>
                </View>

                <View style={styles.weatherRow}>
                  <Image
                    source={{ uri: getIconUrl(weatherData.weather[0].icon) }}
                    style={styles.weatherIcon}
                  />
                  <View>
                    <Text style={styles.tempText}>{Math.round(weatherData.main?.temp)}°C</Text>
                    <Text style={styles.descText}>
                      {weatherData.weather[0].description.charAt(0).toUpperCase() +
                        weatherData.weather[0].description.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Small info chips */}
                <View style={styles.infoChips}>
                  <View style={styles.chip}>
                    <Text style={styles.chipLabel}>Humidity</Text>
                    <Text style={styles.chipValue}>{weatherData.main?.humidity}%</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipLabel}>Wind</Text>
                    <Text style={styles.chipValue}>{weatherData.wind?.speed} m/s</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipLabel}>Sunrise</Text>
                    <Text style={styles.chipValue}>
                      {new Date(weatherData.sys?.sunrise * 1000)
                        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipLabel}>Sunset</Text>
                    <Text style={styles.chipValue}>
                      {new Date(weatherData.sys?.sunset * 1000)
                        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Today's Forecast */}
              <Text style={styles.sectionTitle}>Today's Weather</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 10 }}>
                {todayForecast.map((item, index) => (
                  <View key={index} style={styles.forecastCard}>
                    <Text style={styles.forecastTime}>
                      {item.dt_txt.split(" ")[1].slice(0, 5)}
                    </Text>
                    <Image
                      source={{ uri: getIconUrl(item.weather[0].icon) }}
                      style={styles.forecastIcon}
                    />
                    <Text style={styles.forecastTemp}>
                      {Math.round(item.main.temp)}°C
                    </Text>
                  </View>
                ))}
              </ScrollView>

              {/* 5-Day Forecast */}
              <Text style={styles.sectionTitle}>5-Day Forecast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 10 }}>
                {fiveDayForecast.map((item, index) => (
                  <View key={index} style={styles.forecastCard}>
                    <Text style={styles.forecastTime}>{item.dt_txt.split(" ")[0]}</Text>
                    <Image
                      source={{ uri: getIconUrl(item.weather[0].icon) }}
                      style={styles.forecastIcon}
                    />
                    <Text style={styles.forecastTemp}>
                      {Math.round(item.main.temp)}°C
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.mapBtn}
                onPress={() => setShowMap(!showMap)}
              >
                <Text style={styles.mapBtnText}>
                  {showMap ? "Hide Map" : "Show Map"}
                </Text>
              </TouchableOpacity>

              {showMap && coords && region && (
                <MapView
                  style={{ height: 250, marginTop: 10 }}
                  region={region}
                  provider={PROVIDER_GOOGLE}
                  onRegionChangeComplete={setRegion}
                  onPress={onMapPress}
                  zoomEnabled
                  scrollEnabled
                  zoomControlEnabled
                >
                  <Marker
                    coordinate={tempCoords || coords}
                    draggable
                    onDragEnd={onMarkerDragEnd}
                  />
                </MapView>
              )}

              <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={{ fontSize: 18, marginBottom: 10 }}>
                      Selected Location:
                    </Text>
                    <Text style={{ fontWeight: "bold", marginBottom: 20 }}>
                      {cityName}
                    </Text>
                    <View
                      style={{ flexDirection: "row", justifyContent: "space-around" }}
                    >
                      <TouchableOpacity
                        style={[styles.modalBtn, { backgroundColor: "green" }]}
                        onPress={confirmLocation}
                      >
                        <Text style={{ color: "white", fontWeight: "bold" }}>
                          Confirm
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.modalBtn, { backgroundColor: "red" }]}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={{ color: "white", fontWeight: "bold" }}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </ScrollView>
          )
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "rgba(0,0,0,0.3)",
    marginTop:30
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 20,
    padding: 20,
    marginVertical: 15,
    backdropFilter: "blur(15px)", // Not supported on React Native, but if web use, works
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 15,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationCol: {
    flexDirection: "column",
  },
  cityText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  countryText: {
    fontSize: 18,
    color: "#ddd",
  },
  timeText: {
    fontSize: 20,
    color: "#fff",
  },
  weatherRow: {
    flexDirection: "row",
    marginTop: 15,
    alignItems: "center",
  },
  weatherIcon: {
    width: 100,
    height: 100,
    marginRight: 15,
  },
  tempText: {
    fontSize: 48,
    color: "#fff",
    fontWeight: "bold",
  },
  descText: {
    fontSize: 20,
    color: "#fff",
    textTransform: "capitalize",
  },
  infoChips: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginVertical: 5,
    minWidth: 80,
    alignItems: "center",
  },
  chipLabel: {
    color: "#eee",
    fontSize: 14,
  },
  chipValue: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginVertical: 10,
  },
  forecastCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 15,
    padding: 15,
    marginRight: 12,
    width: 100,
    alignItems: "center",
  },
  forecastTime: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 5,
  },
  forecastIcon: {
    width: 50,
    height: 50,
  },
  forecastTemp: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    marginTop: 5,
  },
  mapBtn: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  mapBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
});
