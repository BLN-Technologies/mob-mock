import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
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
  const { t } = useTranslation();
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
        <Text style={styles.title}>{t.buyer.postRequest}</Text>
        <Text style={styles.subtitle}>
          {t.buyer.requestSubtitle}
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
          title={t.buyer.submitRequest}
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
