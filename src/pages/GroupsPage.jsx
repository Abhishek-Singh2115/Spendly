export const GroupsPage = ({ ctx }) => {
  return (
    <div>
      <div className="page-top">
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Groups
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          Split expenses with friends
        </div>
      </div>
      <div style={{ padding: '0 18px' }}>
        <div className="empty" style={{ marginTop: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>👥</div>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 8
          }}>
            Coming Soon
          </div>
          <p style={{ fontSize: 13 }}>
            Group expense splitting will be available in the next update.
          </p>
        </div>
      </div>
    </div>
  );
};