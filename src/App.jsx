import CrystalCarousel from "./scenes/Crystal/CrystalCarousel";
import heroImg from "./assets/hero.png";

function App() {
  return (
    <CrystalCarousel
      items={[
        { image: heroImg, label: "PROJETO_01" },
      ]}
    />
  );
}

export default App;