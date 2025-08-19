import mongoose, { Schema, Document } from 'mongoose';

export interface IDashboard extends Document {
  stats: Array<{
    name: string;
    stat: string;
    change: string;
    changeType: 'increase' | 'decrease';
  }>;
  chartData: Array<{
    name: string;
    sales: number;
    inventory: number;
  }>;
  categoryStats: Array<{
    _id: string;
    count: number;
    totalValue: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    item: string;
    time: string;
    type: 'add' | 'update' | 'alert' | 'sale' | 'order';
  }>;
  lastUpdated: Date;
}

const StatsItemSchema = new Schema({
  name: { type: String, required: true },
  stat: { type: String, required: true },
  change: { type: String, required: true },
  changeType: { type: String, enum: ['increase', 'decrease'], required: true }
}, { _id: false });

const ChartDataItemSchema = new Schema({
  name: { type: String, required: true },
  sales: { type: Number, required: true },
  inventory: { type: Number, required: true }
}, { _id: false });

const CategoryStatsItemSchema = new Schema({
  _id: { type: String, required: true },
  count: { type: Number, required: true },
  totalValue: { type: Number, required: true }
}, { _id: false });

const RecentActivityItemSchema = new Schema({
  id: { type: String, required: true },
  action: { type: String, required: true },
  item: { type: String, required: true },
  time: { type: String, required: true },
  type: { type: String, enum: ['add', 'update', 'alert', 'sale', 'order'], required: true }
}, { _id: false });

const DashboardSchema = new Schema<IDashboard>({
  stats: { type: [StatsItemSchema], default: [] },
  chartData: { type: [ChartDataItemSchema], default: [] },
  categoryStats: { type: [CategoryStatsItemSchema], default: [] },
  recentActivity: { type: [RecentActivityItemSchema], default: [] },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.models.Dashboard || mongoose.model<IDashboard>('Dashboard', DashboardSchema);
