import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Heart,
  Users,
} from "lucide-react";

const upcomingItems = [
  {
    id: 1,
    title: "RSVP Deadline",
    date: "March 6, 2027",
    countdown: "193 days",
  },
  {
    id: 2,
    title: "Wedding Party Final Try-On",
    date: "March 31, 2027",
    countdown: "218 days",
  },
  {
    id: 3,
    title: "Wedding Day",
    date: "April 24, 2027",
    countdown: "242 days",
  },
];

function Dashboard() {
  return (
    <div className="page">
      <div className="page-header dashboard-header">
        <div>
          <p className="page-eyebrow">Wedding Command Center</p>
          <h1>Good morning, Maddie</h1>
          <p className="page-description">
            Everything you need to plan your wedding, all in one place.
          </p>
        </div>
      </div>

      <section className="wedding-countdown-card">
        <Heart size={22} strokeWidth={1.5} />

        <div className="wedding-countdown-number">242</div>
        <p className="wedding-countdown-label">days to go</p>

        <div className="wedding-countdown-date">
          April 24, 2027
        </div>
      </section>

      <section className="dashboard-stats">
        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <CheckCircle2 size={22} strokeWidth={1.6} />
          </div>

          <div>
            <p className="stat-label">Tasks</p>
            <p className="stat-value">34 / 82</p>
            <p className="stat-detail">completed</p>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <Users size={22} strokeWidth={1.6} />
          </div>

          <div>
            <p className="stat-label">Guests</p>
            <p className="stat-value">150</p>
            <p className="stat-detail">attending</p>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="stat-icon">
            <CalendarDays size={22} strokeWidth={1.6} />
          </div>

          <div>
            <p className="stat-label">Next Event</p>
            <p className="stat-value stat-value-small">Florist Meeting</p>
            <p className="stat-detail">Friday at 2:00 PM</p>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="content-card">
          <div className="content-card-header">
            <div>
              <p className="card-eyebrow">Coming Up</p>
              <h2>Countdowns</h2>
            </div>

            <Clock3 size={20} strokeWidth={1.6} />
          </div>

          <div className="countdown-list">
            {upcomingItems.map((item) => (
              <div className="countdown-row" key={item.id}>
                <div>
                  <p className="countdown-title">{item.title}</p>
                  <p className="countdown-date">{item.date}</p>
                </div>

                <span className="countdown-pill">{item.countdown}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="content-card">
          <div className="content-card-header">
            <div>
              <p className="card-eyebrow">To Do</p>
              <h2>Upcoming Tasks</h2>
            </div>

            <CheckCircle2 size={20} strokeWidth={1.6} />
          </div>

          <div className="empty-state compact">
            <p>Your upcoming tasks will appear here.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;