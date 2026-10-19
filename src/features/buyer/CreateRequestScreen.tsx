import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, typography, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/forms/FormField';
import { User } from '../../domain/models';

interface CreateRequestScreenProps {
  user: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateRequestScreen: React.FC<CreateRequestScreenProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  const { t, language } = useTranslation();
  const [cropName, setCropName] = useState('Maize');
  const [variety, setVariety] = useState('Nyirakaragaza');
  const [minGrade, setMinGrade] = useState('Grade A');
  const [quantityKg, setQuantityKg] = useState('20000');
  const [targetPriceRwf, setTargetPriceRwf] = useState('410');
  const [deliveryDistrict, setDeliveryDistrict] = useState('Kigali (Gasabo)');
  const [deliverySector, setDeliverySector] = useState('Gisozi');
  const [requiredDate, setRequiredDate] = useState('2026-10-30');
  const [notes, setNotes] = useState('Institutional delivery to central school kitchen facility.');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600)); // simulate submission
    setLoading(false);
    Alert.alert(
      t.common.appName,
      t.buyer.requestSubmitted,
      [{ text: t.common.done, onPress: onSuccess }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerBox}>
        <Text style={styles.title}>
          {language === 'rw' ? 'Saba Umusaruro Wihariye' : 'Request Sourcing'}
        </Text>
        <Text style={styles.subtitle}>
          {language === 'rw'
            ? 'Ubusabe bwo gushakirwa umusaruro wihariye ntabwo buhita bwemeza itumiza; Cargo Operations izabahuza na koperative zibifite maze bikorerwe isuzuma.'
            : 'A sourcing request communicates desired demand to Cargo Operations. It coordinates eligible supplier lots and schedules inspection; it is distinct from a confirmed stock order.'}
        </Text>
      </View>

      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#EAF2EC',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#DCE4DD',
      }}>
        <Ionicons name="information-circle-outline" size={18} color="#174A35" />
        <Text style={{ fontSize: 12, color: '#174A35', flex: 1, lineHeight: 16 }}>
          {language === 'rw'
            ? 'Icyitonderwa: Ubusabe ntiburema umusaruro mu buryo bw\'ako kanya cyangwa ngo bwirengagize igenzura.'
            : 'Notice: Sourcing requests do not bypass mandatory physical quality inspection or guarantee immediate fulfillment.'}
        </Text>
      </View>

      <FormField
        label={t.supplier.cropType}
        value={cropName}
        onChangeText={setCropName}
        placeholder="e.g. Maize, Dry Beans"
      />

      <FormField
        label={t.supplier.variety}
        value={variety}
        onChangeText={setVariety}
        placeholder="e.g. Nyirakaragaza"
      />

      <FormField
        label={t.supplier.qualityGrade}
        value={minGrade}
        onChangeText={setMinGrade}
        placeholder="Grade A, Grade B"
      />

      <FormField
        label={t.buyer.requiredQuantity}
        value={quantityKg}
        onChangeText={setQuantityKg}
        keyboardType="numeric"
        placeholder="20000"
        suffix="kg"
        helper="Minimum institutional bulk order is 1,000 kg"
      />

      <FormField
        label={t.buyer.targetPrice}
        value={targetPriceRwf}
        onChangeText={setTargetPriceRwf}
        keyboardType="numeric"
        placeholder="410"
        prefix="RWF"
        suffix="/ kg"
      />

      <FormField
        label={t.buyer.deliveryDistrict}
        value={deliveryDistrict}
        onChangeText={setDeliveryDistrict}
        placeholder="e.g. Kigali (Gasabo)"
        icon="location-outline"
      />

      <FormField
        label={t.buyer.deliverySector}
        value={deliverySector}
        onChangeText={setDeliverySector}
        placeholder="e.g. Gisozi"
        icon="location-outline"
      />

      <FormField
        label={t.buyer.requiredDeliveryDate}
        value={requiredDate}
        onChangeText={setRequiredDate}
        placeholder="YYYY-MM-DD"
        icon="calendar-outline"
      />

      <FormField
        label={t.buyer.procurementNotes}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={2}
      />

      <View style={styles.buttonRow}>
        <Button
          title={t.common.cancel}
          onPress={onCancel}
          variant="secondary"
          style={styles.btnHalf}
        />
        <Button
          title={language === 'rw' ? 'Saba Umusaruro' : 'Request stock'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.btnHalf}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl + 20,
  },
  headerBox: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    fontSize: 18,
    color: colors.neutralHeadings,
  },
  subtitle: {
    ...typography.caption,
    color: colors.neutralGray,
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btnHalf: {
    flex: 1,
  },
});
