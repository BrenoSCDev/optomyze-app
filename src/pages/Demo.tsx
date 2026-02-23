import { motion } from 'framer-motion';
import OptomyzeMetrics from '@/components/dashboards/OptomyzeMetrics';
import { mockPeriodicData, mockMonthlyChartsData } from '@/data/mockMetricsData';
import OptoIcon from '@/assets/opto-icon.png';

const Demo = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-dark">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8">
        {/* Demo banner */}
        <motion.div
          className="mb-6 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-3"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <img src={OptoIcon} alt="Optomyze" className="h-6 w-6" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Demo Mode</span> — This dashboard is populated with sample data for demonstration purposes.
          </p>
        </motion.div>

        <OptomyzeMetrics
          demoMode
          demoPeriodicData={mockPeriodicData}
          demoMonthlyData={mockMonthlyChartsData}
        />
      </div>
    </div>
  );
};

export default Demo;
