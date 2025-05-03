import { onBeforeUnmount, onMounted, ref } from "vue";
import { SECTION_IDS } from "~/pages/Public/Home/home.constant";

const useNavbarActiveSection = () => {
  const activeSection = ref<string | null>(null);
  const handleScroll = () => {
    const sections = Object.values(SECTION_IDS);

    for (const sectionId of sections) {
      const section = document.getElementById(sectionId);
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
          activeSection.value = sectionId;
          break;
        }
      }
    }
  };

  onMounted(() => {
    window.addEventListener("scroll", handleScroll);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("scroll", handleScroll);
  });

  return activeSection;
};

export default useNavbarActiveSection;
