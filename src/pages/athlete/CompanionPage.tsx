import TrainingCompanion from '../../components/athlete/TrainingCompanion';
export default function CompanionPage() {
  return (
    <div className="product-page companion-page">
      <div className="page-greeting">
        <div>
          <h1>A conversation grounded in you.</h1>
          <p>Your training, recovery and photos. One private place to ask.</p>
        </div>
      </div>
      <TrainingCompanion />
    </div>
  );
}
