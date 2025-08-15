import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard
} from "react-native";

const API_KEY = "e0965310293ef580143b14b8ebf99412";

export default function CitySearchWithAutoSuggest({ onSelectCity }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const skipFetch = useRef(false); // yeh flag hoga

  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false; // next time se normal
      return; // abhi ke liye fetch mat karo
    }

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
        );
        const data = await res.json();
        setSuggestions(data);
      } catch (e) {
        console.log("Error fetching suggestions", e);
      }
    };

    fetchSuggestions();
  }, [query]);

  const handleSelect = (city) => {
    Keyboard.dismiss();
    setSuggestions([]);
    skipFetch.current = true; // next query update pe fetch ko skip karega
    setQuery(`${city.name}, ${city.country}`);
    if (onSelectCity) onSelectCity(city);
  };

  return (
    <View style={{ marginBottom: 10 }}>
      <TextInput
        style={styles.input}
        placeholder="Type city name"
        value={query}
        onChangeText={setQuery}
      />
      {suggestions.length > 0 && (
        <FlatList
          style={styles.suggestionsContainer}
          data={suggestions}
          keyExtractor={(item, index) => index.toString()}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleSelect(item)}
            >
              <Text>
                {item.name}
                {item.state ? `, ${item.state}` : ""}, {item.country}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#999",
  },
  suggestionsContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#999",
    borderTopWidth: 0,
    maxHeight: 150,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
