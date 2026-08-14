import GovPanel from '../../components/GovPanel';
import './AdminShared.scss';

// /admin/ai-portal - placeholder for AI analysis configuration/oversight.
// The client-facing AI Portal (src/pages/AiPortal.jsx) has no admin-side
// controls defined yet, so this just marks the spot.
function AdminAiPortal() {
  return (
    <div className="admin-page">
      <GovPanel title="AI Portal" icon="🤖">
        <p className="panel-notice">
          AI tahlili sozlamalari va nazorati boʻyicha boshqaruv vositalari shu yerda paydo
          boʻladi.
        </p>
      </GovPanel>
    </div>
  );
}

export default AdminAiPortal;
