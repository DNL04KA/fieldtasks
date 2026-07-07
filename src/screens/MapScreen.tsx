import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useMappableTasks } from '../store/selectors';
import { EmptyState } from '../components/EmptyState';
import { STATUS_LABELS } from '../constants';
import type { RootStackParamList } from '../navigation/types';

/**
 * The map is Leaflet + OpenStreetMap rendered in a WebView: no API key is
 * required (Google Maps SDK crashes without one on Android release builds).
 * Marker popups post the task id back to React Native to open the detail
 * screen. Tiles need internet; the pill bar below works offline.
 */
function buildMapHtml(
  markers: { id: string; title: string; label: string; address: string; color: string; lat: number; lng: number }[],
): string {
  // <-escape so task titles can never break out of the <script> block
  const data = JSON.stringify(markers).replace(/</g, '\\u003c');
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;padding:0;height:100%;}
  .popup-title{font-weight:700;font-size:14px;margin-bottom:2px;}
  .popup-meta{font-size:12px;color:#555;margin-bottom:8px;}
  .open-btn{background:#2456E6;color:#fff;border:none;border-radius:8px;
    padding:8px 14px;font-size:13px;font-weight:600;width:100%;}
</style></head><body><div id="map"></div>
<script>
  var tasks = ${data};
  var map = L.map('map', { zoomControl: true });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  var bounds = [];
  tasks.forEach(function (t) {
    var marker = L.circleMarker([t.lat, t.lng], {
      radius: 10, color: t.color, fillColor: t.color, fillOpacity: 0.85, weight: 2
    }).addTo(map);
    var el = document.createElement('div');
    var title = document.createElement('div');
    title.className = 'popup-title';
    title.textContent = t.title;
    var meta = document.createElement('div');
    meta.className = 'popup-meta';
    meta.textContent = t.label + ' · ' + t.address;
    var btn = document.createElement('button');
    btn.className = 'open-btn';
    btn.textContent = 'Open task';
    btn.onclick = function () { window.ReactNativeWebView.postMessage(t.id); };
    el.appendChild(title); el.appendChild(meta); el.appendChild(btn);
    marker.bindPopup(el);
    bounds.push([t.lat, t.lng]);
  });
  if (bounds.length === 1) { map.setView(bounds[0], 14); }
  else { map.fitBounds(bounds, { padding: [40, 40] }); }
</script></body></html>`;
}

export function MapScreen() {
  const { colors, statusColor } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tasks = useMappableTasks();

  const html = useMemo(
    () =>
      buildMapHtml(
        tasks.map((t) => ({
          id: t.id,
          title: t.title,
          label: STATUS_LABELS[t.status],
          address: t.location.address,
          color: statusColor(t.status),
          lat: t.location.latitude!,
          lng: t.location.longitude!,
        })),
      ),
    [tasks, statusColor],
  );

  if (tasks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="map-outline"
          title="No tasks on the map"
          subtitle="Add coordinates to a task (or pick a quick location) to see it here."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        style={styles.map}
        source={{ html }}
        originWhitelist={['*']}
        onMessage={(event) => {
          const taskId = event.nativeEvent.data;
          if (tasks.some((t) => t.id === taskId)) {
            navigation.navigate('TaskDetail', { taskId });
          }
        }}
      />
      {/* Offline/screen-reader fallback: open tasks without touching the map */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface }]}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Tap a marker or open a task directly:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {tasks.map((task) => (
            <Pressable
              key={task.id}
              accessibilityRole="button"
              accessibilityLabel={`Open task ${task.title}`}
              onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
              style={[styles.pill, { borderColor: statusColor(task.status), backgroundColor: colors.surface }]}
            >
              <View style={[styles.pillDot, { backgroundColor: statusColor(task.status) }]} />
              <Text style={[styles.pillLabel, { color: colors.text }]} numberOfLines={1}>
                {task.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  bottomBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 14,
    paddingVertical: 10,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  hint: { fontSize: 13, textAlign: 'center' },
  pillRow: { gap: 8, paddingHorizontal: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 12,
    minHeight: 44,
    maxWidth: 220,
  },
  pillDot: { width: 8, height: 8, borderRadius: 4 },
  pillLabel: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
});
