import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useMappableTasks } from '../store/selectors';
import { EmptyState } from '../components/EmptyState';
import { STATUS_LABELS } from '../constants';
import type { RootStackParamList } from '../navigation/types';

const DEFAULT_REGION = {
  latitude: 40.7128,
  longitude: -74.006,
  latitudeDelta: 0.35,
  longitudeDelta: 0.35,
};

export function MapScreen() {
  const { colors, statusColor } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const tasks = useMappableTasks();

  // Center the map on the first task with coordinates, otherwise use the default city view
  const initialRegion = useMemo(() => {
    const first = tasks[0];
    if (!first) return DEFAULT_REGION;
    return {
      latitude: first.location.latitude!,
      longitude: first.location.longitude!,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="🗺️"
          title="No tasks on the map"
          subtitle="Add coordinates to a task (or pick a quick location) to see it here."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        {tasks.map((task) => (
          <Marker
            key={task.id}
            coordinate={{
              latitude: task.location.latitude!,
              longitude: task.location.longitude!,
            }}
            pinColor={statusColor(task.status)}
            title={task.title}
            description={`${STATUS_LABELS[task.status]} · ${task.location.address}`}
            onCalloutPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
          />
        ))}
      </MapView>
      <View style={[styles.hintBar, { backgroundColor: colors.surface }]}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Tap a marker, then tap its callout to open the task
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  hintBar: { position: 'absolute', bottom: 16, left: 16, right: 16, borderRadius: 12, padding: 12 },
  hint: { fontSize: 13, textAlign: 'center' },
});
