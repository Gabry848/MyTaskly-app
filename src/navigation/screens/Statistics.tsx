
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart,
} from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// Dati demo per i grafici
const lineChartData = {
  labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'],
  datasets: [
    {
      data: [
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
      ],
      color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // viola
      strokeWidth: 2,
    },
    {
        data: [
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100,
        ],
        color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`, // blu
        strokeWidth: 2,
      },
  ],
  legend: ['Task Completati', 'Task Creati'],
};

const barChartData = {
  labels: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
  datasets: [
    {
      data: [20, 45, 28, 80, 99, 43, 60],
    },
  ],
};

const pieChartData = [
  { name: 'Lavoro', population: 25, color: 'rgba(131, 167, 234, 1)', legendFontColor: '#7F7F7F', legendFontSize: 15 },
  { name: 'Personale', population: 30, color: '#F00', legendFontColor: '#7F7F7F', legendFontSize: 15 },
  { name: 'Studio', population: 15, color: '#008080', legendFontColor: '#7F7F7F', legendFontSize: 15 },
  { name: 'Hobby', population: 30, color: '#ffa726', legendFontColor: '#7F7F7F', legendFontSize: 15 },
];

const progressChartData = {
  labels: ['Progresso 1', 'Progresso 2', 'Progresso 3'], // optional
  data: [0.4, 0.6, 0.8],
};

// Configurazione comune per i grafici
const chartConfig = {
  backgroundGradientFrom: '#ffffff',
  backgroundGradientFromOpacity: 0.8,
  backgroundGradientTo: '#ffffff',
  backgroundGradientToOpacity: 1,
  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
  strokeWidth: 2, // optional, default 3
  barPercentage: 0.7,
  useShadowColorFromDataset: false, // optional
  decimalPlaces: 0, // optional, defaults to 2dp
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#007bff',
  },
  propsForBackgroundLines: {
    strokeDasharray: '', // solid lines
    stroke: '#e3e3e3'
  },
  propsForLabels: {
    fontSize: 11,
    fontWeight: '500',
    fill: '#333'
  }
};

export function Statistics() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Statistiche Dettagliate</Text>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Andamento Mensile Task</Text>
        <LineChart
          data={lineChartData}
          width={screenWidth * 0.9}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chartStyle}
        />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Task Settimanali</Text>
        <BarChart
          style={styles.chartStyle}
          data={barChartData}
          width={screenWidth * 0.9}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          showValuesOnTopOfBars={true}
        />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Distribuzione Task per Categoria</Text>
        <PieChart
          data={pieChartData}
          width={screenWidth * 0.9}
          height={220}
          chartConfig={chartConfig}
          accessor={"population"}
          backgroundColor={"transparent"}
          paddingLeft={"15"}
          center={[10, 0]}
          absolute // mostra valori assoluti invece di percentuali
          style={styles.chartStyle}
        />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Progresso Obiettivi</Text>
        <ProgressChart
          data={progressChartData}
          width={screenWidth * 0.9}
          height={220}
          strokeWidth={16}
          radius={32}
          chartConfig={chartConfig}
          hideLegend={false}
          style={styles.chartStyle}
        />
      </View>

      {/* Aggiungi qui altri grafici se necessario */}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center', // Centra il grafico orizzontalmente
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  chartStyle: {
    borderRadius: 16,
  },
});

export default Statistics;
